import React from 'react';
import { SwarmRound } from '@/pages/AgentSwarm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { BrainCircuit } from 'lucide-react';

interface SwarmDisplayProps {
  rounds: SwarmRound[];
  isLoading: boolean;
}

const SwarmDisplay: React.FC<SwarmDisplayProps> = ({ rounds, isLoading }) => {
  if (isLoading && rounds.length === 0) {
    return (
      <div className="space-y-4 pt-4">
        <p className="text-center text-muted-foreground">Aguardando os especialistas iniciarem a colaboração...</p>
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!isLoading && rounds.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10 flex flex-col items-center justify-center border-2 border-dashed rounded-lg h-full min-h-[300px]">
        <BrainCircuit className="h-12 w-12 mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-foreground">Painel de Colaboração</h3>
        <p>As contribuições dos especialistas aparecerão aqui.</p>
        <p className="text-sm">Preencha o formulário e inicie uma sessão para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {rounds.map((round, roundIndex) => (
        <div key={roundIndex}>
          <div className="flex items-center mb-4">
            <div className="flex-grow border-t"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Round {round.round}
            </span>
            <div className="flex-grow border-t"></div>
          </div>
          <div className="space-y-6">
            {round.contributions.map((contribution, contributionIndex) => (
              <div key={contributionIndex} className="flex items-start space-x-4">
                <Avatar className="border">
                  <AvatarImage src={`/${contribution.agent.toLowerCase().replace(' ', '-')}.png`} alt={contribution.agent} />
                  <AvatarFallback>{contribution.agent.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted/50 p-4 rounded-lg border">
                  <p className="font-semibold text-primary">{contribution.agent}</p>
                  <p className="text-foreground/90 whitespace-pre-wrap mt-1">{contribution.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {isLoading && rounds.length > 0 && (
         <div className="flex items-center justify-center p-6 space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Especialistas estão colaborando...</p>
         </div>
      )}
    </div>
  );
};

export default SwarmDisplay;