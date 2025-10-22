import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { availableAgents } from '@/lib/agents';
import { ExpertCard } from '@/components/ExpertCard';
import { CustomAgent } from './CustomClones';
import { showError } from '@/utils/toast';
import { ConversationList } from '@/components/ConversationList';
import { ChatInterface } from '@/components/ChatInterface';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

type View = 'agent_selection' | 'conversation_list' | 'chat_view' | 'loading';

type SelectedAgent = {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  title?: string;
  emoji?: string;
  type: 'predefined' | 'custom';
};

interface Conversation {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar?: string;
  agent_type: 'predefined' | 'custom';
  title?: string;
  updated_at: string;
}

const IndividualChat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<View>(conversationId ? 'loading' : 'agent_selection');
  const [selectedAgent, setSelectedAgent] = useState<SelectedAgent | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(true);
  const { session } = useSession();

  useEffect(() => {
    const loadConversationFromUrl = async () => {
      if (!conversationId || !session?.user) return;

      try {
        const { data: convData, error: convError } = await supabase.from('conversations').select('*').eq('id', conversationId).single();
        if (convError || !convData) throw new Error('Conversa não encontrada.');
        
        setSelectedConversation(convData as Conversation);

        let agentData: SelectedAgent | null = null;
        if (convData.agent_type === 'predefined') {
          const foundAgent = availableAgents.find(a => a.id === convData.agent_id);
          if (foundAgent) agentData = { ...foundAgent };
        } else {
          const { data: customAgentData, error: customAgentError } = await supabase.from('custom_agents').select('id, name, title, description, persona, emoji').eq('id', convData.agent_id).single();
          if (customAgentError || !customAgentData) throw new Error('Clone customizado não encontrado.');
          agentData = { ...customAgentData, avatar: '/placeholder.svg', type: 'custom' };
        }

        if (!agentData) throw new Error('Agente não encontrado.');
        
        setSelectedAgent(agentData);
        setView('chat_view');
      } catch (error: any) {
        showError(error.message || 'Falha ao carregar a conversa.');
        navigate('/chat');
      }
    };

    if (conversationId) {
      loadConversationFromUrl();
    }
  }, [conversationId, session, supabase, navigate]);

  useEffect(() => {
    const fetchCustomAgents = async () => {
      if (!session?.user) {
        setLoadingCustom(false);
        return;
      }
      setLoadingCustom(true);
      try {
        const { data, error } = await supabase.from('custom_agents').select('id, name, title, description, persona, created_at, emoji').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (error) throw error;
        setCustomAgents(data || []);
      } catch (error) {
        showError("Não foi possível carregar seus clones customizados.");
      } finally {
        setLoadingCustom(false);
      }
    };

    if (view === 'agent_selection') {
      fetchCustomAgents();
    }
  }, [session, view, supabase]);

  useEffect(() => {
    const agentIdToSelect = searchParams.get('agentId');
    if (!agentIdToSelect || loadingCustom || view !== 'agent_selection') return;

    const allAgents = [
      ...availableAgents,
      ...customAgents.map(clone => ({
        id: clone.id, name: clone.name, avatar: '/placeholder.svg', title: clone.title || 'Clone Customizado', description: clone.description || 'Um especialista de IA criado por você.', tags: ['Customizado'], fidelity: 'Alta' as const, customizable: true, type: 'custom' as const, emoji: clone.emoji
      }))
    ];

    const agent = allAgents.find(a => a.id === agentIdToSelect);

    if (agent) {
      handleAgentSelect(agent);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('agentId');
      setSearchParams(newSearchParams, { replace: true });
    } else if (!loadingCustom) {
      showError(`Clone com ID "${agentIdToSelect}" não encontrado.`);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('agentId');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, customAgents, loadingCustom, setSearchParams, view]);

  const handleAgentSelect = (agent: SelectedAgent) => {
    setSelectedAgent(agent);
    setView('conversation_list');
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setView('chat_view');
  };

  const handleNewConversation = () => {
    setSelectedConversation(null);
    setView('chat_view');
  };

  const handleBackToAgentSelection = () => {
    setSelectedAgent(null);
    navigate('/chat');
    setView('agent_selection');
  };

  const handleBackToConversationList = () => {
    setSelectedConversation(null);
    navigate('/chat');
    setView('conversation_list');
  };

  const renderAgentSelection = () => {
    const customAgentsForDisplay = customAgents.map(clone => ({
      id: clone.id, name: clone.name, avatar: '/placeholder.svg', title: clone.title || 'Clone Customizado', description: clone.description || 'Um especialista de IA criado por você.', tags: ['Customizado'], fidelity: 'Alta' as const, customizable: true, type: 'custom' as const, emoji: clone.emoji
    }));
    return (
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
        <header className="mb-8 text-center"><h1 className="text-3xl font-bold tracking-tight">Chat Individual</h1><p className="text-muted-foreground mt-1">Selecione um especialista para iniciar uma conversa.</p></header>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Especialistas Renomados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{availableAgents.map(agent => (<ExpertCard key={agent.id} agent={agent} onSelect={() => handleAgentSelect(agent)} />))}</div>
        <h2 className="text-2xl font-bold tracking-tight mt-12 mb-4">Seus Clones Customizados</h2>
        {loadingCustom ? <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : customAgentsForDisplay.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{customAgentsForDisplay.map(agent => (<ExpertCard key={agent.id} agent={agent as any} onSelect={() => handleAgentSelect(agent)} />))}</div> : <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg"><h3 className="text-lg font-semibold text-foreground">Nenhum clone encontrado</h3><p>Vá para a página "Criar Clones" para começar.</p></div>}
      </div>
    );
  };

  if (view === 'loading') {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }
  if (view === 'conversation_list' && selectedAgent) {
    return <ConversationList agent={selectedAgent} onSelectConversation={handleSelectConversation} onNewConversation={handleNewConversation} onBack={handleBackToAgentSelection} />;
  }
  if (view === 'chat_view' && selectedAgent) {
    return <ChatInterface agent={selectedAgent} initialConversation={selectedConversation} onBack={handleBackToConversationList} onConversationDeleted={handleBackToConversationList} />;
  }
  return renderAgentSelection();
};

export default IndividualChat;