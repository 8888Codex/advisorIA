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
  
  console.log("🔍 === INICIANDO BUSCA NA PERPLEXITY ===");
  console.log(`🔑 API Key existe: ${apiKey ? 'SIM' : 'NÃO'}`);
  console.log(`📝 Query: "${query}"`);
  
  if (!apiKey) {
    console.error("❌ PERPLEXITY_API_KEY não encontrada!");
    return null;
  }

  try {
    console.log("🌐 Fazendo requisição para Perplexity...");
    
    const requestBody = {
      model: "llama-3.1-sonar-large-128k-online",
      messages: [
        {
          role: "system",
          content: "Você é um assistente de pesquisa. Forneça informações precisas e atualizadas sobre o tópico solicitado. Seja conciso mas informativo."
        },
        {
          role: "user", 
          content: query
        }
      ],
      max_tokens: 1000,
      temperature: 0.2,
    };
    
    console.log("📤 Enviando requisição...");

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📥 Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;
    
    if (result) {
      console.log("✅ BUSCA REALIZADA COM SUCESSO!");
      console.log(`📄 Conteúdo: ${result.substring(0, 100)}...`);
      return result;
    } else {
      console.error("❌ Resposta sem conteúdo");
      return null;
    }
    
  } catch (error) {
    console.error("💥 ERRO na busca:", error.message);
    return null;
  }
}

async function callAnthropic(messages: any[], systemPrompt: string): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  
  if (!apiKey) {
    throw new Error("Chave da Anthropic não encontrada");
  }

  console.log("🧠 Chamando Anthropic...");

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
    console.error(`❌ Erro Anthropic ${response.status}:`, errorText);
    throw new Error(`Erro na API: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

serve(async (req) => {
  console.log("🚀 === FUNÇÃO INICIADA ===");
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { messages, agentName } = body;
    
    console.log(`👤 Agente: ${agentName}`);
    console.log(`💬 Mensagens: ${messages?.length || 0}`);

    if (!agentName || !messages) {
      return new Response(JSON.stringify({ 
        content: "Dados inválidos fornecidos."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const systemPrompt = agentPersonas[agentName];
    if (!systemPrompt) {
      return new Response(JSON.stringify({ 
        content: `Especialista "${agentName}" não encontrado.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const lastUserMessage = messages[messages.length - 1];
    const userQuery = lastUserMessage?.content || "";
    
    console.log(`🔍 Analisando: "${userQuery}"`);

    // ETAPA 1: Decidir se precisa buscar
    let needsSearch = false;
    const searchKeywords = ['atual', 'hoje', 'recente', 'último', 'novo', '2024', '2025', 'agora', 'iPhone', 'Apple', 'Amazon', 'Google', 'Meta', 'Tesla', 'mercado', 'tendência'];
    
    for (const keyword of searchKeywords) {
      if (userQuery.toLowerCase().includes(keyword.toLowerCase())) {
        needsSearch = true;
        break;
      }
    }

    console.log(`🎯 Precisa buscar: ${needsSearch ? 'SIM' : 'NÃO'}`);

    // ETAPA 2: Buscar se necessário
    let searchContext = null;
    if (needsSearch) {
      console.log("🔍 Iniciando busca...");
      searchContext = await searchWithPerplexity(userQuery);
    }

    // ETAPA 3: Gerar resposta
    let finalSystemPrompt = systemPrompt;
    
    if (searchContext) {
      console.log("📊 Incorporando dados da web");
      finalSystemPrompt = `${systemPrompt}

=== INFORMAÇÕES ATUALIZADAS DA INTERNET ===
${searchContext}

INSTRUÇÕES: Use essas informações para enriquecer sua resposta, mas não mencione que fez uma busca. Integre os dados naturalmente.`;
    }

    try {
      const assistantResponse = await callAnthropic(messages, finalSystemPrompt);
      console.log("✅ Resposta gerada!");

      return new Response(JSON.stringify({ 
        content: assistantResponse 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (anthropicError) {
      console.error("💥 Erro Anthropic:", anthropicError.message);
      
      return new Response(JSON.stringify({ 
        content: `Olá! Eu sou ${agentName}. No momento, estou com dificuldades técnicas. Tente novamente em alguns minutos.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error) {
    console.error("💥 ERRO GERAL:", error.message);
    
    return new Response(JSON.stringify({ 
      content: "Desculpe, ocorreu um erro técnico. Tente novamente em alguns minutos."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
})