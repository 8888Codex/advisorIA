import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { availableAgents } from '@/lib/agents';
import { SendHorizonal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const IndividualChat = () => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleAgentSelect = (agentName: string) => {
    setSelectedAgent(agentName);
    setMessages([
      {
        role: 'assistant',
        content: `Olá! Eu sou ${agentName}. Como posso ajudar você hoje?`,
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Placeholder for backend call
    setTimeout(() => {
      const assistantResponse: Message = {
        role: 'assistant',
        content: `Esta é uma resposta simulada de ${selectedAgent}. A lógica real será implementada em breve.`,
      };
      setMessages(prev => [...prev, assistantResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const currentAgent = availableAgents.find(agent => agent.name === selectedAgent);

  return (
    <div className="container mx-auto p-4 md:p-8 h-full flex flex-col">
      <h1 className="text-3xl font-bold mb-6 text-center">Chat Individual</h1>
      {!selectedAgent ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Selecione um Especialista</CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={handleAgentSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha com quem conversar..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAgents.map(agent => (
                    <SelectItem key={agent.id} value={agent.name}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={agent.avatar} alt={agent.name} />
                          <AvatarFallback>{agent.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span>{agent.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="flex-1 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={currentAgent?.avatar} alt={currentAgent?.name} />
                <AvatarFallback>{currentAgent?.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <CardTitle>{currentAgent?.name}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedAgent(null)}>
              Trocar Especialista
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100vh-250px)] p-6" ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-start gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <Avatar>
                        <AvatarImage src={currentAgent?.avatar} alt={currentAgent?.name} />
                        <AvatarFallback>{currentAgent?.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'max-w-md rounded-lg px-4 py-3',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3 justify-start">
                    <Avatar>
                      <AvatarImage src={currentAgent?.avatar} alt={currentAgent?.name} />
                      <AvatarFallback>{currentAgent?.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <p className="text-sm text-muted-foreground">Digitando...</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
              <Input
                id="message"
                placeholder="Digite sua mensagem..."
                className="flex-1"
                autoComplete="off"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading}>
                <SendHorizonal className="h-4 w-4" />
                <span className="sr-only">Enviar</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default IndividualChat;