// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.20.1";

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

Responda sempre em português brasileiro, mantenha sua personalidade autêntenta e seja conciso. Termine suas respostas com uma pergunta para manter o diálogo fluindo.

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { messages, agent } = body;
    
    if (!agent || !messages) {
      return new Response("Dados inválidos.", { headers: corsHeaders, status: 400 });
    }

    let systemPrompt = "";

    if (agent.type === 'predefined') {
      systemPrompt = agentPersonas[agent.name];
      if (!systemPrompt) {
        return new Response(`Especialista predefinido "${agent.name}" não encontrado.`, { headers: corsHeaders, status: 404 });
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
          return new Response(`Erro ao buscar a persona do clone customizado.`, { headers: corsHeaders, status: 500 });
      }
      
      if (!customAgent) {
        return new Response(`Clone customizado com ID ${agent.id} não encontrado.`, { headers: corsHeaders, status: 404 });
      }

      systemPrompt = customAgent.persona;
    } else {
      return new Response(`Tipo de agente desconhecido: "${agent.type}".`, { headers: corsHeaders, status: 400 });
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

    const stream = await anthropic.messages.stream({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages as Anthropic.MessageParam[],
    });

    const responseStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const chunk = encoder.encode(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
            controller.enqueue(chunk);
          }
        }
        controller.close();
      },
    });

    return new Response(responseStream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });

  } catch (error) {
    console.error("💥 ERRO GERAL:", error);
    return new Response("Desculpe, ocorreu um erro técnico.", { headers: corsHeaders, status: 500 });
  }
})