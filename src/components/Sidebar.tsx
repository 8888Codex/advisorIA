import { NavLink } from "react-router-dom";
import { BrainCircuit, MessageSquare, Bot, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/agent-swarm", icon: BrainCircuit, label: "Enxame de Agentes" },
  { to: "/chat", icon: MessageSquare, label: "Chat Individual" },
  { to: "/clones", icon: Bot, label: "Criar Clones" },
];

export function Sidebar() {
  return (
    <div className="flex h-full flex-col gap-2 bg-muted/40 p-2">
      <div className="flex h-16 items-center justify-center border-b">
        <h1 className="text-lg font-semibold">Consultoria IA</h1>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Tooltip key={item.to}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    buttonVariants({ variant: isActive ? "default" : "ghost", size: "default" }),
                    "w-full justify-start"
                  )
                }
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </div>
  );
}