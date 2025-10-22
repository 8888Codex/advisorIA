import React, { useState, useRef, useEffect } from 'react';
import SwarmForm from '@/components/SwarmForm';
import SwarmDisplay from '@/components/SwarmDisplay';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, History, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SwarmHistory } from '@/components/SwarmHistory';
import { useSession } from '@/contexts/SessionContext';

export interface AgentContribution {
  agent: string;
  text: string;
}

export interface SwarmRound {
  round: number;
  contributions: AgentContribution[];
}

type View = 'new_session' | 'history' | 'session_detail';

const AgentSwarm = () => {
  const [view, setView] = useState<View>('new_session');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // State for live session
  const [liveRounds, setLiveRounds] = useState<SwarmRound[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // State for viewing history
  const [historicRounds, setHistoricRounds] = useState<SwarmRound[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const { supabase } = useSession();

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleStartSwarm = ({ prompt, agents, mode }: { prompt: string; agents: { id: string; name: string; type: 'predefined' | 'custom' }[]; mode: string }) => {
    if (!prompt || agents.length === 0) {
      setError("Por favor, insira um problema e selecione pelo menos um especialista.");
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsLoading(true);
    setLiveRounds([]);
    setError(null);

    const queryParams = new URLSearchParams({
      prompt,
      agents: JSON.stringify(agents),
      mode,
    });
    
    const url = `https://xkhsbxlwbgipzutufjei.supabase.co/functions/v1/agent-swarm?${queryParams.toString()}`;
    
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'done') {
        setIsLoading(false);
        eventSource.close();
        eventSourceRef.current = null;
        return;
      }
      setLiveRounds(prevRounds => [...prevRounds, data]);
    };

    eventSource.onerror = (err) => {
      console.error("Falha no EventSource:", err);
      setError("Ocorreu um erro ao conectar com o servidor de colaboração.");
      setIsLoading(false);
      eventSource.close();
      eventSourceRef.current = null;
    };
  };

  const handleSelectSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setView('session_detail');
    setIsHistoryLoading(true);
    setHistoricRounds([]);

    try {
      const { data: roundsData, error: roundsError } = await supabase
        .from('swarm_rounds')
        .select('id, round_number')
        .eq('session_id', sessionId)
        .order('round_number', { ascending: true });

      if (roundsError) throw roundsError;

      const rounds: SwarmRound[] = [];
      for (const round of roundsData) {
        const { data: contributionsData, error: contributionsError } = await supabase
          .from('swarm_contributions')
          .select('agent_name, contribution_text')
          .eq('round_id', round.id);
        
        if (contributionsError) throw contributionsError;

        rounds.push({
          round: round.round_number,
          contributions: contributionsData.map(c => ({ agent: c.agent_name, text: c.contribution_text })),
        });
      }
      setHistoricRounds(rounds);
    } catch (error) {
      console.error("Error fetching session details:", error);
      setError("Não foi possível carregar os detalhes da sessão.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'history':
        return <SwarmHistory onSelectSession={handleSelectSession} />;
      case 'session_detail':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Sessão</CardTitle>
            </CardHeader>
            <CardContent>
              {isHistoryLoading ? (
                <div className="flex justify-center items-center h-full py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <SwarmDisplay rounds={historicRounds} isLoading={false} />
              )}
            </CardContent>
          </Card>
        );
      case 'new_session':
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
            <div className="lg:col-span-1">
              <SwarmForm onSubmit={handleStartSwarm} isLoading={isLoading} />
            </div>
            <div className="lg:col-span-2 flex flex-col">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle>Painel de Colaboração</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <SwarmDisplay rounds={liveRounds} isLoading={isLoading} />
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enxame de Agentes IA</h1>
          <p className="text-muted-foreground mt-1">
            Descreva seu desafio e deixe nossos especialistas digitais colaborarem para encontrar a melhor solução.
          </p>
        </div>
        {view === 'new_session' ? (
          <Button variant="outline" onClick={() => setView('history')}>
            <History className="mr-2 h-4 w-4" />
            Ver Histórico
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setView('new_session')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Nova Sessão
          </Button>
        )}
      </header>
      {renderContent()}
    </div>
  );
};

export default AgentSwarm;