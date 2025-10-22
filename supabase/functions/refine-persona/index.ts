import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const { personaText, agentName } = await req.json();
    if (!personaText || !agentName) {
      return new Response(JSON.stringify({ error: 'Texto da persona e nome do agente são obrigatórios.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error("A chave da API da Anthropic não foi configurada.");
    }

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const systemPrompt = `Você é um Engenheiro de Prompt de IA de elite, especializado em criar personas de chatbot robustas e detalhadas. Sua tarefa é pegar um texto de persona bruto e reestruturá-lo em um formato específico e altamente eficaz, em português do Brasil. O formato final DEVE seguir a estrutura dos exemplos fornecidos.`;

    const userPrompt = `
Aqui está um exemplo da estrutura de persona que você DEVE seguir:
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

Agora, pegue o seguinte texto de persona bruto para **${agentName}** e reformate-o EXATAMENTE na estrutura acima. Seja criativo e infira os detalhes para cada seção com base no texto fornecido.

**Texto Bruto:**
"""
${personaText}
"""

Sua resposta final deve ser APENAS o prompt reformatado, começando com "# System Prompt: ${agentName}".
`;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const refinedPersona = response.content[0].text;

    return new Response(JSON.stringify({ refinedPersona }), {
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