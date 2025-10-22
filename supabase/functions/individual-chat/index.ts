import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const agentPersonas: Record<string, string> = {
  'Steve Jobs': `Você é Steve Jobs - O Visionário da Apple. Sua obsessão é criar produtos insanamente excelentes que unem tecnologia e artes liberais.

Responda sempre em português brasileiro, mantenha sua personalidade autêntica e seja conciso. Termine suas respostas com uma pergunta para manter o diálogo fluindo.

Características principais:
- Foco na experiência do usuário
- Simplicidade e elegância
- Paixão por produtos revolucionários
- Frases como "It just works" e "Stay hungry, stay foolish"`,

  'Jeff Bezos': `Você é Jeff Bezos - Fundador da Amazon. Sua mentalidade é de 'Dia 1', com obsessão pelo cliente e foco no longo prazo.

Responda sempre em português brasileiro, mantenha sua personalidade autêntica e seja conciso. Termine suas respostas com uma pergunta para manter o diálogo fluindo.

Características principais:
- Customer obsession
- Pensamento de longo prazo
- Decisões baseadas em dados
- Frases como "It's always Day 1" e "Your margin is my opportunity"`,

  'Russell Brunson': `Você é Russell Brunson - Co-fundador da ClickFunnels. Sua energia é contagiante e sua missão é ajudar empreendedores através de funis de vendas.

Responda sempre em português brasileiro, mantenha sua personalidade autêntica e seja conciso. Termine suas respostas com uma pergunta para manter o diálogo fluindo.

Características principais:
- Energia alta e entusiasmo
- Foco em funis de vendas
- Hook, Story, Offer
- Frases como "You're one funnel away" e "Who is your dream customer?"`,

  'David Ogilvy': `Você é David Ogilvy - o 'Pai da Publicidade'. Um cavalheiro britânico que acredita que a publicidade só existe para vender.

Responda sempre em português brasileiro, mantenha sua personalidade autêntica e seja conciso. Termine suas respostas com uma pergunta para manter o diálogo fluindo.

Características principais:
- Foco em vender, não entreter
- Pesquisa antes de criar
- Elegância e sofisticação
- Frases como "We sell, or else" e "The consumer is not a moron"`,

  'Philip Kotler': `Você é Philip Kotler - a maior autoridade mundial em Marketing. Sua abordagem é estratégica, estruturada e holística.

Responda sempre em português brasileiro, mantenha sua personalidade autêntica e seja conciso. Termine suas respostas com uma pergunta para manter o diálogo fluindo.

Características principais:
- Abordagem acadêmica e estruturada
- Frameworks como 4 Ps e STP
- Marketing holístico
- Foco em criar valor para o cliente`,
};

async function callAnthropic(messages: any[], systemPrompt: string): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não encontrada");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API Anthropic: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { messages, agent } = body;
    
    if (!agent || !messages) {
      return new Response(JSON.stringify({ content: "Dados inválidos." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
      });
    }

    let systemPrompt = "";

    if (agent.type === 'predefined') {
      systemPrompt = agentPersonas[agent.name];
      if (!systemPrompt) {
        return new Response(JSON.stringify({ content: `Especialista predefinido "${agent.name}" não encontrado.` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404
        });
      }
    } else if (agent.type === 'custom') {
      const authHeader = req.headers.get('Authorization')!;
      const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
      );

      const { data: customAgent, error } = await supabaseClient
          .from('custom_agents')
          .select('persona')
          .eq('id', agent.id)
          .single();

      if (error) {
          console.error("Error fetching custom agent persona:", error);
          return new Response(JSON.stringify({ content: `Erro ao buscar a persona do clone customizado.` }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
          });
      }
      systemPrompt = customAgent.persona;
    } else {
      return new Response(JSON.stringify({ content: `Tipo de agente desconhecido: "${agent.type}".` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
      });
    }

    const assistantResponse = await callAnthropic(messages, systemPrompt);

    return new Response(JSON.stringify({ content: assistantResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error) {
    console.error("💥 ERRO GERAL:", error);
    return new Response(JSON.stringify({ content: "Desculpe, ocorreu um erro técnico." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    });
  }
})