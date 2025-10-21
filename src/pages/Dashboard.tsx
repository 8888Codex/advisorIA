import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Enxame de Agentes</CardTitle>
            <CardDescription>Colabore com múltiplos especialistas para resolver problemas complexos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/agent-swarm">Iniciar Sessão</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Chat Individual</CardTitle>
            <CardDescription>Converse diretamente com um clone digital de sua escolha.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/chat">Começar a Conversar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;