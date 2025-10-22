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

    const { messages, agentName } = await req.json();

    if (!agentName || !messages) {
      throw new Error("Nome do especialista e mensagens são obrigatórios.");
    }

    const systemPrompt = agentPersonas[agentName];
    if (!systemPrompt) {
      throw new Error(`Persona para o especialista "${agentName}" não encontrada.`);
    }

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    const assistantResponse = response.content[0].text;

    return new Response(JSON.stringify({ content: assistantResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})