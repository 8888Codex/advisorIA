import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Plataforma de Consultoria com IA
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Acesse clones digitais de especialistas renomados para resolver seus maiores desafios de negócios.
        </p>
        <Button asChild size="lg">
          <Link to="/dashboard">Entrar na Plataforma</Link>
        </Button>
      </div>
      <div className="absolute bottom-4">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;