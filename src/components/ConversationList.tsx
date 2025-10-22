import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';
import { showError } from '@/utils/toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Conversation {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar?: string;
  agent_type: 'predefined' | 'custom';
  title?: string;
  updated_at: string;
}

interface SelectedAgent {
  id: string;
  name: string;
  avatar?: string;
  type: 'predefined' | 'custom';
}

interface ConversationListProps {
  agent: SelectedAgent;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
  onBack: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ agent, onSelectConversation, onNewConversation, onBack }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('agent_id', agent.id)
          .order('updated_at', { ascending: false });
        if (error) throw error;
        setConversations(data || []);
      } catch (error) {
        showError('Falha ao carregar as conversas.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [agent]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversas com {agent.name}</h1>
          <p className="text-muted-foreground">Selecione uma conversa para continuar ou inicie uma nova.</p>
        </div>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>Suas conversas recentes com este especialista.</CardDescription>
          </div>
          <Button onClick={onNewConversation}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Conversa
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[50vh]">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : conversations.length > 0 ? (
              <div className="space-y-2">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => onSelectConversation(conv)}
                    className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{conv.title || 'Conversa sem título'}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>Nenhuma conversa encontrada.</p>
                <p>Clique em "Nova Conversa" para começar.</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};