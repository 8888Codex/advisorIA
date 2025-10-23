import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizonal, ArrowLeft, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showError, showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSession } from '@/contexts/SessionContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar?: string;
  agent_type: 'predefined' | 'custom';
  title?: string;
}

interface SelectedAgent {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  title?: string;
  type: 'predefined' | 'custom';
}

interface ChatInterfaceProps {
  agent: SelectedAgent;
  initialConversation: Conversation | null;
  onBack: () => void;
  onConversationDeleted: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ agent, initialConversation, onBack, onConversationDeleted }) => {
  const [conversation, setConversation] = useState<Conversation | null>(initialConversation);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { session } = useSession();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversation) {
        setIsHistoryLoading(false);
        return;
      }
      setIsHistoryLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('role, content')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });
        if (error) throw error;
        setMessages(data as Message[]);
      } catch (error) {
        showError('Falha ao carregar o histórico de mensagens.');
        console.error(error);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    fetchMessages();
  }, [conversation]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isLoading]);

  const handleDeleteConversation = async () => {
    if (!conversation) return;
    try {
      const { error } = await supabase.from('conversations').delete().eq('id', conversation.id);
      if (error) throw error;
      showSuccess('Conversa excluída com sucesso.');
      onConversationDeleted();
    } catch (error) {
      showError('Falha ao excluir a conversa.');
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !session?.user) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let currentConversation = conversation;

    try {
      // Create conversation if it's the first message
      if (!currentConversation) {
        const { data: newConvData, error: newConvError } = await supabase
          .from('conversations')
          .insert({
            user_id: session.user.id,
            agent_id: agent.id,
            agent_name: agent.name,
            agent_avatar: agent.avatar,
            agent_type: agent.type,
            title: input.substring(0, 50),
          })
          .select()
          .single();
        if (newConvError) throw newConvError;
        currentConversation = newConvData as Conversation;
        setConversation(currentConversation);
      }

      // Save user message
      await supabase.from('messages').insert({
        conversation_id: currentConversation.id,
        user_id: session.user.id,
        role: 'user',
        content: input,
      });

      // Add empty assistant message for streaming
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const agentForApi = {
        id: agent.id,
        name: agent.name,
        type: agent.type,
      };

      const response = await fetch(`https://xkhsbxlwbgipzutufjei.supabase.co/functions/v1/individual-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ messages: newMessages, agent: agentForApi }),
      });

      if (!response.ok) {
        throw new Error('Falha na resposta da Edge Function.');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Não foi possível ler a resposta do stream.');
      }
      
      const decoder = new TextDecoder();
      let finalContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.substring(6));
              if (json.content) {
                finalContent += json.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = finalContent;
                  return updated;
                });
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      // Save final assistant message
      await supabase.from('messages').insert({
        conversation_id: currentConversation.id,
        user_id: session.user.id,
        role: 'assistant',
        content: finalContent,
      });

    } catch (error: any) {
      console.error("Erro no ciclo de chat:", error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = `Desculpe, ocorreu um erro. Por favor, tente novamente.`;
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex-1 flex flex-col h-full w-full rounded-none border-0">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar>
            <AvatarImage src={agent.avatar} alt={agent.name} />
            <AvatarFallback>{agent.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{agent.name}</CardTitle>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500")}></span>
              <p className="text-xs text-muted-foreground">{isLoading ? 'Digitando...' : 'Online'}</p>
            </div>
          </div>
        </div>
        {conversation && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Conversa?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente esta conversa e todas as suas mensagens.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConversation}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
          {isHistoryLoading ? (
             <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Carregando histórico...</p>
             </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={agent.avatar} alt={agent.name} />
                <AvatarFallback className="text-3xl">{agent.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold">Converse com {agent.name}</h2>
              <p className="text-muted-foreground max-w-md mt-2">{agent.description}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div key={index} className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {message.role === 'assistant' && (
                    <Avatar>
                      <AvatarImage src={agent.avatar} alt={agent.name} />
                      <AvatarFallback>{agent.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn('max-w-prose px-4 py-3 relative', message.role === 'user' ? 'bg-primary text-primary-foreground rounded-t-xl rounded-bl-xl chat-bubble-user' : 'bg-muted rounded-t-xl rounded-br-xl chat-bubble-assistant')}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <Input
            id="message"
            placeholder="Digite sua mensagem..."
            className="flex-1"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <SendHorizonal className="h-4 w-4" />
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};