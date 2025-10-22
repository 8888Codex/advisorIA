import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { availableAgents } from '@/lib/agents';
import { SendHorizonal, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { ExpertCard } from '@/components/ExpertCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const IndividualChat = () => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { supabase } = useSession();

  useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        scrollAreaRef.current?.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [messages, isLoading]);

  const handleAgentSelect = (agentName: string) => {
    setSelectedAgent(agentName);
    setMessages([]); 
  };

  const handleNewConversation = () => {
    setMessages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !selectedAgent) return;

    const userMessage: Message = { role: 'user', content: input };
    
    const messagesForApi = messages.length === 0 
      ? [{ role: 'assistant', content: `Olá! Eu sou ${selectedAgent}. Como posso ajudar você hoje?` }, userMessage]
      : [...messages, userMessage];

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('individual-chat', {
        body: { messages: messagesForApi, agentName: selectedAgent },
      });

      if (error) {
        throw error;
      }

      const assistantResponse: Message = {
        role: 'assistant',
        content: data.content,
      };
      setMessages(prev => [...prev, assistantResponse]);

    } catch (error: any) {
      console.error("Erro ao chamar a Edge Function:", error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentAgent = availableAgents.find(agent => agent.name === selectedAgent);

  return (
    <div className="container mx-auto p-0 h-full flex flex-col">
      {!selectedAgent ? (
        <div className="p-4 md:p-0">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Chat Individual</h1>
            <p className="text-muted-foreground mt-1">
              Selecione um especialista para iniciar uma conversa.
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableAgents.map(agent => (
              <ExpertCard key={agent.id} agent={agent} onSelect={handleAgentSelect} />
            ))}
          </div>
        </div>
      ) : (
        <Card className="flex-1 flex flex-col h-full w-full rounded-none md:rounded-lg border-0 md:border">
          <CardHeader className="flex flex-row items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedAgent(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar>
                <AvatarImage src={currentAgent?.avatar} alt={currentAgent?.name} />
                <AvatarFallback>{currentAgent?.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{currentAgent?.name}</CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500")}></span>
                  <p className="text-xs text-muted-foreground">{isLoading ? 'Pensando...' : 'Online'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleNewConversation}>Nova Conversa</Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Avatar className="w-24 h-24 mb-4">
                    <AvatarImage src={currentAgent?.avatar} alt={currentAgent?.name} />
                    <AvatarFallback className="text-3xl">{currentAgent?.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold">Converse com {currentAgent?.name}</h2>
                  <p className="text-muted-foreground max-w-md mt-2">{currentAgent?.description}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-start gap-3',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <Avatar>
                          <AvatarImage src={currentAgent?.avatar} alt={currentAgent?.name} />
                          <AvatarFallback>{currentAgent?.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          'max-w-prose px-4 py-3 relative',
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-t-xl rounded-bl-xl chat-bubble-user'
                            : 'bg-muted rounded-t-xl rounded-br-xl chat-bubble-assistant'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-start gap-3 justify-start">
                      <Avatar>
                        <AvatarImage src={currentAgent?.avatar} alt={currentAgent?.name} />
                        <AvatarFallback>{currentAgent?.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg px-4 py-3 flex items-center">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-muted-foreground">Pensando</span>
                          <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce"></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
              <Input
                id="message"
                placeholder="Digite sua mensagem... (Enter para enviar)"
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
      )}
    </div>
  );
};

export default IndividualChat;