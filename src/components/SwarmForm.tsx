import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const availableAgents = [
  { id: 'steve-jobs', name: 'Steve Jobs', avatar: '/steve-jobs.png' },
  { id: 'elon-musk', name: 'Elon Musk', avatar: '/elon-musk.png' },
  { id: 'russell-brunson', name: 'Russell Brunson', avatar: '/russell-brunson.png' },
  { id: 'warren-buffett', name: 'Warren Buffett', avatar: '/warren-buffett.png' },
  { id: 'jeff-bezos', name: 'Jeff Bezos', avatar: '/jeff-bezos.png' },
  { id: 'naval-ravikant', name: 'Naval Ravikant', avatar: '/naval-ravikant.png' },
];

interface SwarmFormProps {
  onSubmit: (data: { prompt: string; agents: string[]; mode: string }) => void;
  isLoading: boolean;
}

const SwarmForm: React.FC<SwarmFormProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [mode, setMode] = useState('auto');

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ prompt, agents: selectedAgents, mode });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Configurar Colaboração</CardTitle>
          <CardDescription>Defina os parâmetros para a sessão.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt">Seu Desafio ou Pergunta</Label>
            <Textarea
              id="prompt"
              placeholder="Ex: Como posso aumentar o engajamento do meu produto SaaS?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Selecione os Especialistas</Label>
            <div className="space-y-2">
              {availableAgents.map(agent => (
                <div key={agent.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={agent.id}
                    checked={selectedAgents.includes(agent.name)}
                    onCheckedChange={() => handleAgentToggle(agent.name)}
                    disabled={isLoading}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={agent.avatar} alt={agent.name} />
                    <AvatarFallback>{agent.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <Label htmlFor={agent.id} className="font-normal cursor-pointer">
                    {agent.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Modo de Colaboração</Label>
            <RadioGroup value={mode} onValueChange={setMode} disabled={isLoading}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="auto" id="auto" />
                <Label htmlFor="auto">Automático (2-5 rounds)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deep" id="deep" />
                <Label htmlFor="deep">Exploração Profunda (3-10 rounds)</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Colaborando...' : 'Iniciar Colaboração'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SwarmForm;