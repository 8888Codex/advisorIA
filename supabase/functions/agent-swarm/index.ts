import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.20.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const agentPersonas: Record<string, string> = {
  'Steve Jobs': "Você é Steve Jobs. Responda focando em design, experiência do usuário e simplicidade radical. Seja visionário e apaixonado. Use uma linguagem direta e inspiradora.",
  'Jeff Bezos': "Você é Jeff Bezos. Responda com uma obsessão implacável pelo cliente. Pense a longo prazo e foque em dados, eficiência operacional e modelos de negócio escaláveis. Use uma abordagem metódica e centrada no cliente.",
  'Russell Brunson': "Você é Russell Brunson. Responda focando em marketing, funis de venda e storytelling. Pense em termos de 'gancho, história, oferta'. Sua abordagem deve ser prática e voltada para a conversão.",
  'David Ogilvy': "Você é David Ogilvy, o 'Pai da Publicidade'. Suas respostas devem ser baseadas em pesquisa, resultados e princípios de copywriting clássicos. Foque em 'big ideas', títulos impactantes e na construção de marcas fortes. Use uma linguagem elegante, direta e persuasiva.",
  'Philip Kotler': "Você é Philip Kotler, uma autoridade mundial em marketing. Suas respostas devem ser estruturadas e estratégicas, baseadas em conceitos fundamentais como os 4 Ps, STP (Segmentação, Targeting, Posicionamento) e marketing holístico. Pense de forma analítica e abrangente sobre o mercado.",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
    });

    const url = new URL(req.url);
    const userPrompt = url.searchParams.get('prompt');
    const agentsParam = url.searchParams.get('agents');
    const mode = url.searchParams.get('mode');

    if (!Deno.env.get("ANTHROPIC_API_KEY")) {
      throw new Error("A chave da API da Anthropic não foi configurada nos segredos do Supabase.");
    }

    if (!userPrompt || !agentsParam) {
      return new Response(JSON.stringify({ error: 'Prompt e especialistas são obrigatórios.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const selectedAgents = agentsParam.split(',');
    const numRounds = mode === 'deep' ? 5 : 3;
    let conversationHistory: Anthropic.MessageParam[] = [{ role: 'user', content: `Desafio do Usuário: "${userPrompt}"` }];

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        for (let i = 1; i <= numRounds; i++) {
          const agentPromises = selectedAgents.map(async (agent) => {
            const persona = agentPersonas[agent] || "Você é um assistente de IA prestativo.";
            
            const response = await anthropic.messages.create({
              model: "claude-3-haiku-20240307",
              max_tokens: 200,
              system: persona,
              messages: [
                ...conversationHistory,
                { role: 'user', content: `Sua tarefa: Forneça sua próxima contribuição para resolver o desafio. Seja conciso e construa sobre as ideias anteriores. Não repita seu nome ou cargo.` }
              ],
            });
            
            const text = response.content[0].text;
            return { agent, text };
          });

          const contributions = await Promise.all(agentPromises);
          
          const assistantMessages: Anthropic.MessageParam[] = contributions.map(c => ({
            role: 'assistant',
            content: `[Contribuição de ${c.agent}]: ${c.text}`
          }));
          conversationHistory.push(...assistantMessages);

          const roundData = {
            round: i,
            contributions: contributions,
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(roundData)}\n\n`));
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})