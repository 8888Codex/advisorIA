import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { useEffect, useState } from "react";
import { BrainCircuit, MessageSquare, ArrowRight } from "lucide-react";

const Dashboard = () => {
  const { session, supabase } = useSession();
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("Erro ao buscar perfil:", error);
        } else if (data) {
          setFirstName(data.first_name);
        }
      }
    };

    fetchProfile();
  }, [session, supabase]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Olá, {firstName || 'Gabriel'}!</h1>
        <p className="text-muted-foreground">
          Selecione uma ferramenta abaixo para começar a resolver seus desafios.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="hover:border-primary/80 transition-colors duration-200">
          <Link to="/agent-swarm" className="flex flex-col h-full p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-md bg-muted">
                <BrainCircuit className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Enxame de Agentes</CardTitle>
                <CardDescription>Colabore com múltiplos especialistas para resolver problemas complexos.</CardDescription>
              </div>
            </div>
            <div className="flex-1 flex items-end justify-end mt-4">
               <div className="flex items-center text-sm font-medium text-primary">
                 Iniciar Sessão <ArrowRight className="ml-2 h-4 w-4" />
               </div>
            </div>
          </Link>
        </Card>
        
        <Card className="hover:border-primary/80 transition-colors duration-200">
          <Link to="/chat" className="flex flex-col h-full p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-md bg-muted">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Chat Individual</CardTitle>
                <CardDescription>Converse diretamente com um clone digital de sua escolha.</CardDescription>
              </div>
            </div>
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