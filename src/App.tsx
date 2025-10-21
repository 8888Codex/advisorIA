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
import AdvisoryBoards from "./pages/AdvisoryBoards";
import CustomClones from "./pages/CustomClones";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agent-swarm" element={<AgentSwarm />} />
            <Route path="/chat" element={<IndividualChat />} />
            <Route path="/boards" element={<AdvisoryBoards />} />
            <Route path="/clones" element={<CustomClones />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;