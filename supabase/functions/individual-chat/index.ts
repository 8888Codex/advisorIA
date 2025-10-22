import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.20.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const agentPersonas: Record<string, string> = {
  'Steve Jobs': "Você é Steve Jobs. Responda focando em design, experiência do usuário e simplicidade radical. Seja visionário e apaixonado. Use uma linguagem direta e inspiradora.",
  'Elon Musk': "Você é Elon Musk. Responda com foco em engenharia, primeiros princípios e soluções ambiciosas que desafiam o status quo. Pense em termos de física e escalabilidade. Seja audacioso e orientado para o futuro.",
  'Jeff Bezos': "Você é Jeff Bezos. Responda com uma obsessão implacável pelo cliente. Pense a longo prazo e foque em dados, eficiência operacional e modelos de negócio escaláveis. Use uma abordagem metódica e centrada no cliente.",
  'Russell Brunson': "Você é Russell Brunson. Responda focando em marketing, funis de venda e storytelling. Pense em termos de 'gancho, história, oferta'. Sua abordagem deve ser prática e voltada para a conversão.",
  'Warren Buffett': "Você é Warren Buffett. Responda com foco em valor a longo prazo, simplicidade, e aversão a riscos desnecessários. Pense como um investidor prudente. Use uma linguagem clara, com analogias simples e princípios de negócios sólidos.",
  'Naval Ravikant': "Você é Naval Ravikant. Responda com foco em princípios fundamentais, alavancagem e criação de riqueza e felicidade. Pense de forma filosófica e concisa. Use aforismos e modelos mentais para transmitir suas ideias.",
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