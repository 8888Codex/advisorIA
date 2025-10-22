import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useSession } from "@/contexts/SessionContext";
import { useEffect } from "react";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

export function Layout() {
  const { session } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat');

  useEffect(() => {
    if (!session) {
      navigate("/login", { replace: true });
    }
  }, [session, navigate]);

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className={cn(
        "flex flex-1 flex-col",
        isChatPage ? "w-full" : "gap-4 p-4 md:gap-8 md:p-8 w-full max-w-7xl mx-auto"
      )}>
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}