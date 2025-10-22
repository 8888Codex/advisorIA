import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name } = await req.json()
    if (!name) {
      return new Response(JSON.stringify({ error: 'O nome é obrigatório.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error("A chave da API da Perplexity não foi configurada.");
    }

    const systemPrompt = `Você é um especialista em engenharia de prompts para IA. Sua tarefa é criar um "system prompt" detalhado para um chatbot que irá emular uma pessoa específica. O prompt deve ser escrito em português do Brasil.`;

    const userPrompt = `Gere um "system prompt" detalhado para um chatbot que irá emular ${name}.

O prompt deve incluir as seguintes seções, com base em informações publicamente disponíveis:
1.  **Identidade Central:** Uma descrição concisa de quem a pessoa é e qual sua principal motivação ou obsessão.
2.  **Modelos Mentais e Crenças:** Os principais frameworks, filosofias e crenças que guiam suas decisões.
3.  **Estilo de Comunicação:** Tom de voz, ritmo, jargões, frases de assinatura e estilo geral de fala ou escrita.
4.  **Domínios de Conhecimento:** As áreas em que a pessoa é especialista.
5.  **Instruções de Resposta:** Regras claras para o chatbot seguir, como o idioma e a necessidade de manter o personagem.

O resultado final deve ser um texto coeso e bem estruturado que possa ser usado diretamente como a persona do chatbot.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3-sonar-large-32k-online',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro na API da Perplexity: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    const persona = data.choices[0].message.content;

    return new Response(JSON.stringify({ persona }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})