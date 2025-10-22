import { NavLink, useNavigate } from "react-router-dom";
import {
  Bot,
  BrainCircuit,
  CircleUser,
  LayoutDashboard,
  Menu,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/contexts/SessionContext";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/agent-swarm", icon: BrainCircuit, label: "Enxame de Agentes" },
  { to: "/chat", icon: MessageSquare, label: "Chat Individual" },
  { to: "/clones", icon: Bot, label: "Criar Clones" },
];

export function Header() {
  const { session, supabase } = useSession();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ avatar_url: string | null, first_name: string | null } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, first_name')
          .eq('id', session.user.id)
          .single();
        if (!error && data) {
          setProfile(data);
        }
      }
    };
    fetchProfile();
  }, [session, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Bot className="h-6 w-6" />
          <span>AdvisorIA</span>
        </NavLink>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "transition-colors hover:text-foreground",
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu de navegação</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <NavLink
              to="/dashboard"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Bot className="h-6 w-6" />
              <span>AdvisorIA</span>
            </NavLink>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "hover:text-foreground",
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          {/* Espaço para busca no futuro */}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ''} alt="User avatar" />
                <AvatarFallback>
                  {profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : <CircleUser className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Menu do usuário</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>Configurações</DropdownMenuItem>
            <DropdownMenuItem disabled>Suporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}