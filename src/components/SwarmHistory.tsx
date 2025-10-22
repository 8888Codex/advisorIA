import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export interface SwarmSession {
  id: string;
  prompt: string;
  created_at: string;
  agents: { name: string }[];
}

interface SwarmHistoryProps {
  onSelectSession: (sessionId: string) => void;
}

export const SwarmHistory: React.FC<SwarmHistoryProps> = ({ onSelectSession }) => {
  const [sessions, setSessions] = useState<SwarmSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSession();

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('swarm_sessions')
          .select('id, prompt, created_at, agents')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setSessions(data || []);
      } catch (error) {
        console.error("Error fetching swarm history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [supabase]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Sessões</CardTitle>
        <CardDescription>Revise suas colaborações anteriores do Enxame de Agentes.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map(session => (
                <div key={session.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-primary truncate max-w-md">{session.prompt}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(session.created_at), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onSelectSession(session.id)}>
                      Ver Detalhes
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {session.agents.map((agent, index) => (
                      <Badge key={index} variant="secondary">{agent.name}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-10 flex flex-col items-center justify-center">
              <Inbox className="h-12 w-12 mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-foreground">Nenhuma sessão encontrada</h3>
              <p>Inicie uma nova colaboração para ver seu histórico aqui.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};