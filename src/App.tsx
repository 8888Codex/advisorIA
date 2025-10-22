import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AgentSwarm from "./pages/AgentSwarm";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import IndividualChat from "./pages/IndividualChat";
import CustomClones from "./pages/CustomClones";
import Login from "./pages/Login";
import { SessionProvider } from "./contexts/SessionContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/agent-swarm" element={<AgentSwarm />} />
              <Route path="/agent-swarm/:sessionId" element={<AgentSwarm />} />
              <Route path="/chat" element={<IndividualChat />} />
              <Route path="/chat/:conversationId" element={<IndividualChat />} />
              <Route path="/clones" element={<CustomClones />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;