import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const agentResponses: Record<string, string[]> = {
  'Steve Jobs': [
    "O foco deve ser na experiência do usuário. Simplicidade é a máxima sofisticação.",
    "Design não é apenas como parece. Design é como funciona.",
    "As pessoas não sabem o que querem até que você mostre a elas."
  ],
  'Elon Musk': [
    "Precisamos pensar a partir dos princípios fundamentais, não por analogia.",
    "A solução é 10x melhor que as alternativas? Se não, não vale a pena.",
    "O único limite é a física. O resto é apenas uma questão de esforço."
  ],
  'Jeff Bezos': [
    "Comece pelo cliente e trabalhe de trás para frente. O que o cliente precisa?",
    "Esteja disposto a ser incompreendido por longos períodos de tempo.",
    "Nós somos obstinados pela visão. Somos flexíveis nos detalhes."
  ],
  'Russell Brunson': ["Qual é o gancho? Qual é a história? Qual é a oferta?"],
  'Warren Buffett': ["Regra nº 1: Nunca perca dinheiro. Regra nº 2: Não se esqueça da regra nº 1."],
  'Naval Ravikant': ["Busque riqueza, não dinheiro ou status. Riqueza são ativos que rendem enquanto você dorme."]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url);
  const prompt = url.searchParams.get('prompt') || "um desafio genérico";
  const agentsParam = url.searchParams.get('agents');
  const mode = url.searchParams.get('mode');

  if (!agentsParam) {
    return new Response(JSON.stringify({ error: 'Nenhum especialista selecionado' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  const selectedAgents = agentsParam.split(',');
  const numRounds = mode === 'deep' ? 5 : 3;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      for (let i = 1; i <= numRounds; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500));

        const contributions = selectedAgents.map(agent => {
          const responses = agentResponses[agent] || ["Analisando..."];
          const responseText = responses[Math.floor(Math.random() * responses.length)];
          return { agent, text: responseText };
        });

        const roundData = {
          round: i,
          contributions: contributions,
        };

        const message = `data: ${JSON.stringify(roundData)}\n\n`;
        controller.enqueue(encoder.encode(message));
      }

      const endMessage = `data: ${JSON.stringify({ type: 'done' })}\n\n`;
      controller.enqueue(encoder.encode(endMessage));

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
})