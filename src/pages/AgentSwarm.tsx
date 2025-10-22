import React, { useState, useRef, useEffect } from 'react';
import SwarmForm from '@/components/SwarmForm';
import SwarmDisplay from '@/components/SwarmDisplay';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export interface AgentContribution {
  agent: string;
  text: string;
}

export interface SwarmRound {
  round: number;
  contributions: AgentContribution[];
}

const AgentSwarm = () => {
  const [rounds, setRounds] = useState<SwarmRound[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleStartSwarm = ({ prompt, agents, mode }: { prompt: string; agents: string[]; mode: string }) => {
    if (!prompt || agents.length === 0) {
      setError("Por favor, insira um problema e selecione pelo menos um especialista.");
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsLoading(true);
    setRounds([]);
    setError(null);

    const queryParams = new URLSearchParams({
      prompt,
      agents: agents.join(','),
      mode,
    });
    
    const url = `https://xkhsbxlwbgipzutufjei.supabase.co/functions/v1/agent-swarm?${queryParams.toString()}`;
    
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("Conexão SSE estabelecida com o servidor.");
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'done') {
        setIsLoading(false);
        eventSource.close();
        eventSourceRef.current = null;
        return;
      }

      setRounds(prevRounds => [...prevRounds, data]);
    };

    eventSource.onerror = (err) => {
      console.error("Falha no EventSource:", err);
      setError("Ocorreu um erro ao conectar com o servidor de colaboração. Verifique o console para mais detalhes.");
      setIsLoading(false);
      eventSource.close();
      eventSourceRef.current = null;
    };
  };

  return (
    <div className="flex flex-col h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Enxame de Agentes IA</h1>
        <p className="text-muted-foreground mt-1">
          Descreva seu desafio e deixe nossos especialistas digitais colaborarem para encontrar a melhor solução.
        </p>
      </header>
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
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Erro na Colaboração</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <SwarmDisplay rounds={rounds} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentSwarm;