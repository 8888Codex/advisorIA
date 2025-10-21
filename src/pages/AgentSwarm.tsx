import React, { useState } from 'react';
import SwarmForm from '@/components/SwarmForm';
import SwarmDisplay from '@/components/SwarmDisplay';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Tipagem para as contribuições dos agentes em cada rodada
export interface AgentContribution {
  agent: string;
  text: string;
}

// Tipagem para cada rodada da colaboração
export interface SwarmRound {
  round: number;
  contributions: AgentContribution[];
}

const AgentSwarm = () => {
  const [rounds, setRounds] = useState<SwarmRound[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartSwarm = ({ prompt, agents, mode }: { prompt: string; agents: string[]; mode: string }) => {
    if (!prompt || agents.length === 0) {
      setError("Por favor, insira um problema e selecione pelo menos um especialista.");
      return;
    }

    setIsLoading(true);
    setRounds([]);
    setError(null);

    // AQUI É ONDE A CONEXÃO SSE SERIA ESTABELECIDA
    // Como não temos um backend, não podemos criar o EventSource de verdade.
    // O código abaixo é um exemplo de como seria.
    // const eventSource = new EventSource(`/api/swarm?prompt=${prompt}&agents=${agents.join(',')}&mode=${mode}`);
    
    // eventSource.onmessage = (event) => {
    //   const newRoundData = JSON.parse(event.data);
    //   setRounds(prevRounds => {
    //     // Lógica para atualizar os rounds com os dados recebidos
    //     // Isso pode ser complexo dependendo de como os dados são transmitidos (palavra por palavra, etc.)
    //     return [...prevRounds, newRoundData];
    //   });
    // };

    // eventSource.onerror = (err) => {
    //   console.error("EventSource failed:", err);
    //   setError("Ocorreu um erro ao conectar com o servidor.");
    //   setIsLoading(false);
    //   eventSource.close();
    // };
    
    // eventSource.onopen = () => {
    //   console.log("Connection to server opened.");
    // };

    // Simulação de dados para fins de UI
    console.log("Iniciando simulação de swarm com:", { prompt, agents, mode });
    setTimeout(() => {
      setRounds([
        {
          round: 1,
          contributions: [
            { agent: 'Steve Jobs', text: 'O foco deve ser na experiência do usuário. Simplicidade é a máxima sofisticação.' },
            { agent: 'Elon Musk', text: 'Concordo, mas precisamos pensar em uma solução 10x melhor que a concorrência, partindo dos princípios fundamentais.' }
          ]
        },
        {
          round: 2,
          contributions: [
            { agent: 'Jeff Bezos', text: 'A obsessão pelo cliente é crucial. O que o cliente ganha com isso? Devemos começar por aí e trabalhar de trás para frente.' },
            { agent: 'Steve Jobs', text: 'Exato. O design não é apenas como parece, é como funciona. A solução precisa ser intuitiva.' }
          ]
        }
      ]);
      setIsLoading(false);
    }, 2000);
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