// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.20.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name } = await req.json();
    if (!name) {
      return new Response(JSON.stringify({ error: 'O nome é obrigatório.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      return new Response(JSON.stringify({ error: "A chave da API da Anthropic não foi configurada." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const systemPrompt = `Você é um Engenheiro de Prompt de IA de elite. Sua tarefa é gerar um objeto JSON contendo uma persona de chatbot detalhada e estruturada, a partir de um nome. A resposta DEVE ser um JSON válido.`;

    const userPrompt = `
Gere um objeto JSON para a persona de **${name}**. Use seu conhecimento sobre esta figura pública para preencher cada campo.

O objeto JSON DEVE ter a seguinte estrutura:
{
  "title": "string",
  "description": "string",
  "emoji": "string",
  "persona": "string"
}

**Instruções para cada campo:**
- **title**: O cargo ou título principal da pessoa (ex: "Co-fundador da Apple").
- **description**: Uma descrição curta e impactante, com no máximo uma frase, sobre a especialidade da pessoa.
- **emoji**: Um único emoji que melhor represente a pessoa ou sua área de atuação.
- **persona**: Um "system prompt" detalhado e estruturado. Use o seguinte formato para o campo "persona":
  \`\`\`
  # System Prompt: [Nome do Agente]
  <identity>
  [Descrição concisa da identidade e obsessão central da pessoa.]
  </identity>
  
  # Identity Core
  - **Cognitive Algorithm**: [Como a pessoa pensa?]
  - **Productive Paradox**: [Qual é a principal contradição produtiva?]
  
  # Meta Axioms
  - **Obsession Central**: [Qual é a sua maior obsessão?]
  - **Belief Filter**: [Através de que lente eles veem o mundo?]
  - **Mental Models**: [Liste os principais modelos mentais.]
  
  # Values & Decision
  - **Hierarchy**: [O que eles valorizam mais, em ordem?]
  - **Decision Template**: [Qual é o template para tomar decisões?]
  - **Trade-offs**: [Quais trocas eles estão sempre dispostos a fazer?]
  
  # Communication Style
  - **Energy**: [Qual é a energia da sua comunicação?]
  - **Language**: [Que tipo de linguagem eles usam?]
  - **Rhythm**: [Qual é o ritmo da sua fala?]
  - **Signature Phrases**: [Liste frases de assinatura famosas.]
  
  # Knowledge Base
  - **Domains**: [Quais são seus principais domínios de conhecimento?]
  
  ---
  INSTRUÇÕES DE RESPOSTA:
  1. IDIOMA: Você DEVE responder SEMPRE em português brasileiro (pt-BR).
  2. Mantenha a energia e o estilo de comunicação descritos.
  3. Seja autêntico à personalidade - não quebre o personagem.
  4. CRÍTICO: Responda sempre em texto direto, SEM descrições de ações entre asteriscos (*ação*). Fale diretamente.
  \`\`\`

Sua resposta final deve ser APENAS o objeto JSON, sem nenhum texto ou formatação adicional.
`;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawContent = response.content[0].text;
    const cleanedContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const personaData = JSON.parse(cleanedContent);

    return new Response(JSON.stringify(personaData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("--- Error in generate-structured-persona function ---", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})