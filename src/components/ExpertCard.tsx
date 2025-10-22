import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Agent } from "@/lib/agents";
import { CheckCircle, MessageSquare, Sparkles } from "lucide-react";

interface ExpertCardProps {
  agent: Agent & { emoji?: string };
  onSelect: (agent: any) => void;
}

export const ExpertCard: React.FC<ExpertCardProps> = ({ agent, onSelect }) => {
  return (
    <Card className="flex flex-col h-full transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="items-center pt-6">
        <Avatar className="w-20 h-20 border-2 border-primary/20">
          <AvatarImage src={agent.avatar} alt={agent.name} />
          <AvatarFallback className="text-4xl bg-transparent">
            {agent.emoji ? agent.emoji : agent.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      </CardHeader>
      <CardContent className="flex-1 text-center space-y-4 px-4">
        <div>
          <h3 className="text-lg font-bold">{agent.name}</h3>
          <p className="text-sm text-muted-foreground">{agent.title}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="secondary" className="text-green-600 border-green-600/50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Alta Fidelidade
          </Badge>
          {agent.customizable && (
            <Badge variant="secondary" className="text-blue-600 border-blue-600/50">
              <Sparkles className="h-3 w-3 mr-1" />
              Customizado
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground px-2 text-balance">{agent.description}</p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
            {agent.tags.map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
        </div>
      </CardContent>
      <CardFooter className="p-4">
        <Button className="w-full" variant="outline" onClick={() => onSelect(agent)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Iniciar Chat
        </Button>
      </CardFooter>
    </Card>
  );
};