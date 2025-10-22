import { NavLink } from "react-router-dom";
import { BrainCircuit, MessageSquare, Bot, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/agent-swarm", icon: BrainCircuit, label: "Enxame de Agentes" },
  { to: "/chat", icon: MessageSquare, label: "Chat Individual" },
  { to: "/clones", icon: Bot, label: "Criar Clones" },
];

export function Sidebar() {
  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <NavLink to="/dashboard" className="flex items-center gap-2 font-semibold">
          <Bot className="h-6 w-6" />
          <span className="">Consultoria IA</span>
        </NavLink>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive && "bg-muted text-primary"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}