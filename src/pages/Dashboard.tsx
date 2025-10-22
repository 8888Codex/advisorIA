import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { useEffect, useState } from "react";
import { BrainCircuit, MessageSquare, ArrowRight, Clock, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard = () => {
  const { session, supabase } = useSession();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [recentSwarms, setRecentSwarms] = useState<any[]>([]);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (session?.user) {
        setIsLoading(true);
        const userId = session.user.id;

        const profilePromise = supabase.from('profiles').select('first_name').eq('id', userId).single();
        const swarmsPromise = supabase.from('swarm_sessions').select('id, prompt, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3);
        const chatsPromise = supabase.from('conversations').select('id, title, agent_name, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(3);

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
                  <Link to={`/agent-swarm/${swarm.id}`} key={swarm.id} className="block p-2 -mx-2 rounded-md hover:bg-muted">
                    <p className="font-medium truncate">{swarm.prompt}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1.5" />
                      {formatDistanceToNow(new Date(swarm.created_at), { addSuffix: true, locale: ptBR })}
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
                  <Link to={`/chat/${chat.id}`} key={chat.id} className="block p-2 -mx-2 rounded-md hover:bg-muted">
                    <p className="font-medium truncate">{chat.title || "Conversa sem título"}</p>
                    <p className="text-xs text-muted-foreground">
                      com {chat.agent_name} • {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true, locale: ptBR })}
                    </p>
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