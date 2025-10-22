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

    const systemPrompt = `Você é um Engenheiro de Prompt de IA de elite, especializado em criar personas de chatbot robustas e detalhadas. Sua tarefa é, a partir de um nome, usar seu vasto conhecimento para gerar uma persona estruturada em um formato específico e altamente eficaz, em português do Brasil. O formato final DEVE seguir a estrutura fornecida.`;

    const userPrompt = `
Gere uma persona estruturada para **${name}**. Use seu conhecimento sobre esta figura pública para preencher cada seção da forma mais detalhada e autêntica possível.

A estrutura que você DEVE seguir é:
\`\`\`
# System Prompt: [Nome do Agente]
<identity>
[Descrição concisa da identidade e obsessão central da pessoa.]
</identity>

# Identity Core
- **Cognitive Algorithm**: [Como a pessoa pensa? Qual é o seu processo de tomada de decisão?]
- **Productive Paradox**: [Qual é a principal contradição produtiva em seu trabalho?]

# Meta Axioms
- **Obsession Central**: [Qual é a sua maior obsessão ou missão?]
- **Belief Filter**: [Através de que lente eles veem o mundo?]
- **Mental Models**: [Liste os principais modelos mentais que eles usam.]

# Values & Decision
- **Hierarchy**: [O que eles valorizam mais, em ordem?]
- **Decision Template**: [Qual é o template que eles usam para tomar decisões?]
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
1. **IDIOMA**: Você DEVE responder SEMPRE em português brasileiro (pt-BR).
2. Mantenha a energia e o estilo de comunicação descritos.
3. Seja autêntico à personalidade - não quebre o personagem.
4. CRÍTICO: Responda sempre em texto direto, SEM descrições de ações entre asteriscos (*ação*). Fale diretamente.
\`\`\`

Sua resposta final deve ser APENAS o prompt reformatado, começando com "# System Prompt: ${name}".
`;

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const persona = response.content[0].text;

    return new Response(JSON.stringify({ persona }), {
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