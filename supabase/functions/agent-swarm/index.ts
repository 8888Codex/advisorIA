import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.20.1";

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
    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    const url = new URL(req.url);
    const userPrompt = url.searchParams.get('prompt');
    const agentsParam = url.searchParams.get('agents');
    const mode = url.searchParams.get('mode');

    if (!Deno.env.get("OPENAI_API_KEY")) {
      throw new Error("A chave da API da OpenAI não foi configurada nos segredos do Supabase.");
    }

    if (!userPrompt || !agentsParam) {
      return new Response(JSON.stringify({ error: 'Prompt e especialistas são obrigatórios.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const selectedAgents = agentsParam.split(',');
    const numRounds = mode === 'deep' ? 5 : 3;
    let conversationHistory = `Desafio do Usuário: "${userPrompt}"\n\n`;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        for (let i = 1; i <= numRounds; i++) {
          conversationHistory += `--- ROUND ${i} ---\n`;

          const agentPromises = selectedAgents.map(agent => {
            const persona = agentPersonas[agent] || "Você é um assistente de IA prestativo.";
            
            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
              { role: 'system', content: persona },
              { role: 'user', content: `Contexto da discussão até agora:\n${conversationHistory}\n\nSua tarefa: Forneça sua próxima contribuição para resolver o desafio. Seja conciso e construa sobre as ideias anteriores. Não repita seu nome ou cargo.` }
            ];

            return openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: messages,
              temperature: 0.7,
              max_tokens: 150,
            }).then(response => ({
              agent,
              text: response.choices[0].message.content?.trim() || "Não foi possível gerar uma resposta.",
            }));
          });

          const contributions = await Promise.all(agentPromises);

          contributions.forEach(c => {
            conversationHistory += `${c.agent}: ${c.text}\n`;
          });

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