import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { useEffect, useState } from "react";
import { BrainCircuit, MessageSquare, ArrowRight, Globe, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const Dashboard = () => {
  const { session, supabase } = useSession();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [testingAPI, setTestingAPI] = useState(false);

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

  const testPerplexityAPI = async () => {
    setTestingAPI(true);
    try {
      console.log("🧪 Iniciando teste da API Perplexity...");
      
      const { data, error } = await supabase.functions.invoke('test-perplexity', {
        body: { query: 'Qual é o iPhone mais recente da Apple?' }
      });

      console.log("📊 Resposta da função:", data);
      console.log("❌ Erro da função:", error);

      if (error) {
        console.error("Erro na função:", error);
        showError(`Erro: ${error.message}`);
      } else if (data?.success) {
        showSuccess("✅ API da Perplexity funcionando! Busca na internet ativa.");
        console.log("✅ Resultado da busca:", data.result);
      } else {
        showError(`❌ Falha na API: ${data?.error || 'Erro desconhecido'}`);
        console.error("❌ Erro detalhado:", data);
      }
    } catch (err: any) {
      console.error("💥 Erro geral:", err);
      showError(`Erro ao testar a API: ${err.message}`);
    } finally {
      setTestingAPI(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Olá, {firstName || 'Gabriel'}!</h1>
        <p className="text-muted-foreground">
          Selecione uma ferramenta abaixo para começar a resolver seus desafios.
        </p>
      </div>

      {/* BOTÃO DE TESTE DA API - MUITO VISÍVEL */}
      <Card className="border-2 border-orange-300 bg-orange-50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Globe className="h-6 w-6 text-orange-600" />
            🧪 TESTE DE CONECTIVIDADE COM INTERNET
          </CardTitle>
          <CardDescription className="text-orange-700">
            <strong>IMPORTANTE:</strong> Teste se os clones conseguem acessar informações atualizadas da internet.
            Este teste vai verificar se a API da Perplexity está funcionando corretamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testPerplexityAPI} 
            disabled={testingAPI}
            size="lg"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            {testingAPI ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                🔍 Testando Conexão com Internet...
              </>
            ) : (
              <>
                <Globe className="mr-2 h-5 w-5" />
                🚀 TESTAR CONEXÃO COM INTERNET AGORA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

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