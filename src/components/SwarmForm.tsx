import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { availableAgents } from '@/lib/agents';
import { useSession } from '@/contexts/SessionContext';
import { Badge } from './ui/badge';

interface AgentOption {
  id: string;
  name: string;
  avatar: string;
  type: 'predefined' | 'custom';
}

interface SwarmFormProps {
  onSubmit: (data: { prompt: string; agents: { id: string; name: string; type: 'predefined' | 'custom' }[]; mode: string }) => void;
  isLoading: boolean;
}

const SwarmForm: React.FC<SwarmFormProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [mode, setMode] = useState('auto');
  const [allAgents, setAllAgents] = useState<AgentOption[]>([]);
  const { session, supabase } = useSession();

  useEffect(() => {
    const fetchAndCombineAgents = async () => {
      const predefined: AgentOption[] = availableAgents.map(a => ({ ...a, type: 'predefined' }));
      
      if (!session?.user) {
        setAllAgents(predefined);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('custom_agents')
          .select('id, name')
          .eq('user_id', session.user.id);
        if (error) throw error;

        const custom: AgentOption[] = data.map(c => ({
          id: c.id,
          name: c.name,
          avatar: '/placeholder.svg',
          type: 'custom'
        }));
        setAllAgents([...predefined, ...custom]);
      } catch (error) {
        console.error("Failed to fetch custom agents for swarm", error);
        setAllAgents(predefined);
      }
    };
    fetchAndCombineAgents();
  }, [session, supabase]);

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgentIds(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedAgentObjects = allAgents.filter(agent => selectedAgentIds.includes(agent.id));
    const agentsForApi = selectedAgentObjects.map(agent => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
    }));
    onSubmit({ prompt, agents: agentsForApi, mode });
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
              {allAgents.map(agent => (
                <div key={agent.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={agent.id}
                    checked={selectedAgentIds.includes(agent.id)}
                    onCheckedChange={() => handleAgentToggle(agent.id)}
                    disabled={isLoading}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={agent.avatar} alt={agent.name} />
                    <AvatarFallback>{agent.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <Label htmlFor={agent.id} className="font-normal cursor-pointer flex items-center gap-2">
                    {agent.name}
                    {agent.type === 'custom' && <Badge variant="secondary">Custom</Badge>}
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