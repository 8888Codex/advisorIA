import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { useEffect, useState } from "react";
import { BrainCircuit, MessageSquare, ArrowRight, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { availableAgents } from "@/lib/agents";

interface RecentSwarm {
  id: string;
  prompt: string;
  created_at: string;
  agents: { id: string; name: string; type: string }[];
}

interface RecentChat {
  id: string;
  title: string;
  agent_name: string;
  agent_avatar: string | null;
  updated_at: string;
}

const Dashboard = () => {
  const { session, supabase } = useSession();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [recentSwarms, setRecentSwarms] = useState<RecentSwarm[]>([]);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (session?.user) {
        setIsLoading(true);
        const userId = session.user.id;

        const profilePromise = supabase.from('profiles').select('first_name').eq('id', userId).single();
        const swarmsPromise = supabase.from('swarm_sessions').select('id, prompt, created_at, agents').eq('user_id', userId).order('created_at', { ascending: false }).limit(3);
        const chatsPromise = supabase.from('conversations').select('id, title, agent_name, agent_avatar, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(3);

        const [{ data: profileData, error: profileError }, { data: swarmsData, error: swarmsError }, { data: chatsData, error: chatsError }] = await Promise.all([profilePromise, swarmsPromise, chatsPromise]);

        if (profileError) console.error("Erro ao buscar perfil:", profileError);
        else if (profileData) setFirstName(profileData.first_name);

        if (swarmsError) console.error("Erro ao buscar enxames:", swarmsError);
        else setRecentSwarms(swarmsData || []);

        if (chatsError) console.error("Erro ao buscar chats:", chatsError);
        else setRecentChats(chatsData || []);

        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [session, supabase]);

  const getAgentAvatar = (agentName: string) => {
    const agent = availableAgents.find(a => a.name === agentName);
    return agent ? agent.avatar : '/placeholder.svg';
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Olá, {firstName || '...'}!</h1>
        <p className="text-muted-foreground">
          Continue de onde parou ou inicie uma nova sessão.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sessões Recentes do Enxame</CardTitle>
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4 pt-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentSwarms.length > 0 ? (
              <div className="space-y-2">
                {recentSwarms.map(swarm => (
                  <Link to={`/agent-swarm/${swarm.id}`} key={swarm.id} className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-muted">
                    <div>
                      <p className="font-medium truncate max-w-xs">{swarm.prompt}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1.5" />
                        {formatDistanceToNow(new Date(swarm.created_at), { addSuffix: true, locale: ptBR })}
                      </div>
                    </div>
                    <div className="flex -space-x-2 overflow-hidden">
                      {swarm.agents.slice(0, 3).map(agent => (
                        <Avatar key={agent.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-background">
                          <AvatarImage src={getAgentAvatar(agent.name)} />
                          <AvatarFallback>{agent.name.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                      ))}
                      {swarm.agents.length > 3 && (
                        <Avatar className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 ring-background bg-muted">
                          <AvatarFallback className="text-xs">+{swarm.agents.length - 3}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground pt-2">Nenhuma sessão encontrada.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversas Recentes</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4 pt-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentChats.length > 0 ? (
              <div className="space-y-2">
                {recentChats.map(chat => (
                  <Link to={`/chat/${chat.id}`} key={chat.id} className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-muted">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage src={chat.agent_avatar || getAgentAvatar(chat.agent_name)} alt={chat.agent_name} />
                        <AvatarFallback>{chat.agent_name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium truncate max-w-xs">{chat.title || "Conversa sem título"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground pt-2">Nenhuma conversa encontrada.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="hover:border-primary/80 transition-colors duration-200">
          <Link to="/agent-swarm" className="flex flex-col h-full p-6">
            <CardTitle>Iniciar Novo Enxame</CardTitle>
            <CardDescription className="mt-1">Colabore com múltiplos especialistas para resolver problemas complexos.</CardDescription>
            <div className="flex-1 flex items-end justify-end mt-4">
               <div className="flex items-center text-sm font-medium text-primary">
                 Iniciar Sessão <ArrowRight className="ml-2 h-4 w-4" />
               </div>
            </div>
          </Link>
        </Card>
        
        <Card className="hover:border-primary/80 transition-colors duration-200">
          <Link to="/chat" className="flex flex-col h-full p-6">
            <CardTitle>Iniciar Novo Chat</CardTitle>
            <CardDescription className="mt-1">Converse diretamente com um clone digital de sua escolha.</CardDescription>
            <div className="flex-1 flex items-end justify-end mt-4">
               <div className="flex items-center text-sm font-medium text-primary">
                 Começar a Conversar <ArrowRight className="ml-2 h-4 w-4" />
               </div>
            </div>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;