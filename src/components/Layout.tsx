import { Outlet, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useSession } from "@/contexts/SessionContext";
import { useEffect } from "react";
import { Header } from "./Header";

export function Layout() {
  const { session } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate("/login", { replace: true });
    }
  }, [session, navigate]);

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}