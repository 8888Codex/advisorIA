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
  
  console.log("🔍 === INICIANDO BUSCA REAL NA PERPLEXITY ===");
  console.log(`🔑 API Key configurada: ${apiKey ? 'SIM' : 'NÃO'}`);
  console.log(`📝 Query de busca: "${query}"`);
  
  if (!apiKey) {
    console.error("❌ PERPLEXITY_API_KEY não encontrada nos segredos!");
    return null;
  }

  try {
    const requestBody = {
      model: "llama-3.1-sonar-large-128k-online",
      messages: [
        {
          role: "system",
          content: "Você é um assistente de pesquisa especializado. Forneça informações precisas, atualizadas e detalhadas sobre o tópico solicitado. Inclua dados específicos, números, datas e contexto relevante."
        },
        {
          role: "user", 
          content: query
        }
      ],
      max_tokens: 1500,
      temperature: 0.1,
    };
    
    console.log("🌐 Enviando requisição para Perplexity API...");

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📥 Status da resposta: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro HTTP ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;
    
    if (result && result.trim()) {
      console.log("✅ BUSCA NA INTERNET REALIZADA COM SUCESSO!");
      console.log(`📊 Dados obtidos (${result.length} caracteres)`);
      console.log(`📄 Preview: ${result.substring(0, 150)}...`);
      return result;
    } else {
      console.error("❌ Resposta da Perplexity vazia ou inválida");
      return null;
    }
    
  } catch (error) {
    console.error("💥 ERRO CRÍTICO na busca Perplexity:", error);
    return null;
  }
}

async function callAnthropic(messages: any[], systemPrompt: string): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY não encontrada");
  }

  console.log("🧠 Chamando Anthropic API...");

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
    throw new Error(`Erro na API Anthropic: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

serve(async (req) => {
  console.log("🚀 === FUNÇÃO INDIVIDUAL-CHAT INICIADA ===");
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { messages, agentName } = body;
    
    console.log(`👤 Especialista: ${agentName}`);
    console.log(`💬 Total de mensagens: ${messages?.length || 0}`);

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
    
    console.log(`🔍 === ANÁLISE DA MENSAGEM ===`);
    console.log(`📝 Mensagem: "${userQuery}"`);

    // ETAPA 1: Análise mais agressiva para busca
    let searchContext = null;
    let shouldSearch = false;
    
    // Lista expandida de termos que indicam necessidade de busca
    const searchTriggers = [
      // Temporais
      'atual', 'hoje', 'agora', 'recente', 'último', 'nova', 'novo', 'últimos', 'recentes',
      '2024', '2025', 'este ano', 'ano passado', 'mês passado', 'semana passada',
      
      // Empresas e produtos
      'apple', 'iphone', 'ipad', 'mac', 'amazon', 'aws', 'google', 'meta', 'facebook',
      'tesla', 'microsoft', 'netflix', 'uber', 'airbnb', 'tiktok', 'instagram',
      'clickfunnels', 'shopify', 'wordpress', 'youtube',
      
      // Termos de mercado
      'mercado', 'vendas', 'receita', 'lucro', 'ações', 'bolsa', 'economia',
      'tendência', 'tendências', 'estatística', 'dados', 'pesquisa', 'estudo',
      'relatório', 'análise', 'crescimento', 'queda', 'aumento', 'diminuição',
      
      // Termos de busca explícita
      'como está', 'o que aconteceu', 'qual é', 'me fale sobre', 'explique sobre',
      'informações sobre', 'dados sobre', 'notícias sobre'
    ];
    
    const queryLower = userQuery.toLowerCase();
    
    for (const trigger of searchTriggers) {
      if (queryLower.includes(trigger.toLowerCase())) {
        shouldSearch = true;
        console.log(`🎯 Trigger encontrado: "${trigger}"`);
        break;
      }
    }
    
    // Se a mensagem tem mais de 10 palavras e menciona empresas/produtos, também busca
    const wordCount = userQuery.split(' ').length;
    if (wordCount > 10 && (queryLower.includes('empresa') || queryLower.includes('produto') || queryLower.includes('negócio'))) {
      shouldSearch = true;
      console.log(`🎯 Mensagem longa sobre negócios detectada`);
    }

    console.log(`🔍 Decisão de busca: ${shouldSearch ? 'SIM - VAI BUSCAR' : 'NÃO - Conhecimento interno'}`);

    // ETAPA 2: Executar busca se necessário
    if (shouldSearch) {
      console.log("🌐 === EXECUTANDO BUSCA NA INTERNET ===");
      searchContext = await searchWithPerplexity(userQuery);
      
      if (searchContext) {
        console.log("✅ DADOS DA INTERNET OBTIDOS COM SUCESSO!");
      } else {
        console.log("❌ Busca falhou - usando conhecimento interno");
      }
    }

    // ETAPA 3: Gerar resposta
    let finalSystemPrompt = systemPrompt;
    
    if (searchContext) {
      console.log("📊 === INCORPORANDO DADOS DA INTERNET NA RESPOSTA ===");
      finalSystemPrompt = `${systemPrompt}

=== INFORMAÇÕES ATUALIZADAS DA INTERNET ===
${searchContext}

INSTRUÇÕES CRÍTICAS:
- Use essas informações atualizadas para enriquecer sua resposta
- Cite dados específicos, números e fatos quando relevante
- Integre as informações de forma natural na sua personalidade
- NÃO mencione que fez uma busca na internet
- Seja específico e preciso com os dados obtidos`;
    }

    try {
      console.log("🧠 Gerando resposta final...");
      const assistantResponse = await callAnthropic(messages, finalSystemPrompt);
      console.log("✅ === RESPOSTA GERADA COM SUCESSO ===");

      return new Response(JSON.stringify({ 
        content: assistantResponse 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (anthropicError) {
      console.error("💥 Erro na Anthropic:", anthropicError);
      
      return new Response(JSON.stringify({ 
        content: `Olá! Eu sou ${agentName}. No momento, estou com dificuldades técnicas. Tente novamente em alguns minutos.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error) {
    console.error("💥 ERRO GERAL:", error);
    
    return new Response(JSON.stringify({ 
      content: "Desculpe, ocorreu um erro técnico. Tente novamente em alguns minutos."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
})