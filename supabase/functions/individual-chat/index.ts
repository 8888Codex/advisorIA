import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

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

Responda sempre em português brasileiro, mantenha sua personalidade autêntica e seja conciso. Termine suas respostas com uma pergunta para manter o diálogo fluindo.

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

async function searchWithPerplexity(query: string): Promise<string | null> {
  const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
  if (!apiKey) {
    console.error("❌ PERPLEXITY_API_KEY não encontrada!");
    return null;
  }

  try {
    // Melhorar a query para obter dados mais atuais
    let enhancedQuery = query;
    
    // Se a pergunta for sobre iPhone, tornar mais específica
    if (query.toLowerCase().includes('iphone')) {
      enhancedQuery = `What is the latest iPhone model released by Apple in 2024? Include iPhone 16 series details and current information.`;
    }
    // Se for sobre produtos Apple em geral
    else if (query.toLowerCase().includes('apple')) {
      enhancedQuery = `${query} - provide the most current information from 2024`;
    }
    // Para outras perguntas, adicionar contexto temporal
    else {
      enhancedQuery = `${query} - current information and latest updates from 2024`;
    }
    
    console.log(`🔍 Busca melhorada: "${enhancedQuery}"`);
    
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3-sonar-large-32k-online",
        messages: [
          {
            role: "system",
            content: "You are a research assistant specialized in providing the most current and accurate information. Always prioritize recent data from 2024 and the latest updates. Be specific about dates and current status."
          },
          {
            role: "user", 
            content: enhancedQuery
          }
        ],
        max_tokens: 1500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro HTTP ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;
    
    if (result) {
      console.log(`✅ Busca bem-sucedida! Resultado: ${result.substring(0, 200)}...`);
    }
    
    return result || null;
    
  } catch (error) {
    console.error("💥 ERRO na busca Perplexity:", error);
    return null;
  }
}

async function callAnthropic(messages: any[], systemPrompt: string): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não encontrada");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API Anthropic: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { messages, agentName } = body;
    
    if (!agentName || !messages) {
      return new Response(JSON.stringify({ content: "Dados inválidos." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
      });
    }

    const systemPrompt = agentPersonas[agentName];
    if (!systemPrompt) {
      return new Response(JSON.stringify({ content: `Especialista "${agentName}" não encontrado.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404
      });
    }

    const userQuery = messages[messages.length - 1]?.content || "";
    
    // SEMPRE fazer busca na internet para perguntas dos usuários
    console.log(`🤖 ${agentName} processando: "${userQuery}"`);
    const searchContext = await searchWithPerplexity(userQuery);
    
    let finalSystemPrompt = systemPrompt;
    if (searchContext) {
      console.log(`🌐 ${agentName} obteve dados da internet!`);
      finalSystemPrompt = `${systemPrompt}

=== INFORMAÇÕES ATUALIZADAS DA INTERNET (2024) ===
${searchContext}

INSTRUÇÕES CRÍTICAS: 
- Use PRIORITARIAMENTE essas informações atualizadas
- Integre os dados naturalmente em seu raciocínio
- Mantenha sua personalidade
- NÃO mencione que fez uma busca
- Se houver conflito entre seu conhecimento base e essas informações, PRIORIZE as informações atualizadas`;
    } else {
      console.log(`⚠️ ${agentName} não conseguiu dados da internet, usando conhecimento base.`);
    }

    const assistantResponse = await callAnthropic(messages, finalSystemPrompt);

    return new Response(JSON.stringify({ content: assistantResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error) {
    console.error("💥 ERRO GERAL:", error);
    return new Response(JSON.stringify({ content: "Desculpe, ocorreu um erro técnico." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    });
  }
})