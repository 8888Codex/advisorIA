import React, { useState, useRef, useEffect } from 'react';
import SwarmForm from '@/components/SwarmForm';
import SwarmDisplay from '@/components/SwarmDisplay';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
      setError("Ocorreu um erro ao conectar com o servidor de colaboração.");
      setIsLoading(false);
      eventSource.close();
      eventSourceRef.current = null;
    };
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Enxame de Agentes IA</h1>
      <p className="text-center text-muted-foreground mb-8">
        Descreva seu desafio e deixe nossos especialistas digitais colaborarem para encontrar a melhor solução.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <SwarmForm onSubmit={handleStartSwarm} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Painel de Colaboração</CardTitle>
            </CardHeader>
            <CardContent>
              {error && <p className="text-red-500">{error}</p>}
              <SwarmDisplay rounds={rounds} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentSwarm;