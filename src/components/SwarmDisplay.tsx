import React from 'react';
import { SwarmRound } from '@/pages/AgentSwarm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface SwarmDisplayProps {
  rounds: SwarmRound[];
  isLoading: boolean;
}

const SwarmDisplay: React.FC<SwarmDisplayProps> = ({ rounds, isLoading }) => {
  if (isLoading && rounds.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-center text-muted-foreground">Aguardando os especialistas iniciarem a colaboração...</p>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!isLoading && rounds.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>O painel de colaboração aparecerá aqui.</p>
        <p>Preencha o formulário e inicie uma sessão.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rounds.map((round, roundIndex) => (
        <Card key={roundIndex}>
          <CardHeader>
            <CardTitle>Round {round.round}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {round.contributions.map((contribution, contributionIndex) => (
              <div key={contributionIndex} className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={`/${contribution.agent.toLowerCase().replace(' ', '-')}.png`} alt={contribution.agent} />
                  <AvatarFallback>{contribution.agent.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{contribution.agent}</p>
                  <p className="text-muted-foreground">{contribution.text}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      {isLoading && rounds.length > 0 && (
         <div className="flex items-center justify-center p-4">
            <p className="text-muted-foreground">Aguardando próximo round...</p>
         </div>
      )}
    </div>
  );
};

export default SwarmDisplay;