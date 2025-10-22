import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.20.1";

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
    console.error("❌ PERPLEXITY_API_KEY não encontrada nos segredos!");
    return null;
  }

  try {
    console.log("🌐 Fazendo requisição para Perplexity...");
    
    const requestBody = {
      model: "llama-3.1-sonar-large-128k-online",
      messages: [
        {
          role: "system",
          content: "Você é um assistente de pesquisa especializado. Forneça informações precisas, atualizadas e específicas sobre o tópico solicitado. Inclua dados, números, datas e fontes quando possível."
        },
        {
          role: "user", 
          content: query
        }
      ],
      max_tokens: 1500,
      temperature: 0.1,
    };
    
    console.log("📤 Enviando para Perplexity:", JSON.stringify(requestBody, null, 2));

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
    console.log("📊 Resposta completa da Perplexity:", JSON.stringify(data, null, 2));
    
    const result = data.choices?.[0]?.message?.content;
    
    if (result) {
      console.log("✅ BUSCA REALIZADA COM SUCESSO!");
      console.log(`📄 Conteúdo obtido (${result.length} caracteres):`, result.substring(0, 200) + "...");
      return result;
    } else {
      console.error("❌ Resposta sem conteúdo válido");
      return null;
    }
    
  } catch (error) {
    console.error("💥 ERRO CRÍTICO na busca Perplexity:", error);
    console.error("Stack trace:", error.stack);
    return null;
  }
}

serve(async (req) => {
  console.log("🚀 === FUNÇÃO INDIVIDUAL-CHAT INICIADA ===");
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { messages, agentName } = body;
    console.log(`👤 Agente: ${agentName}`);
    console.log(`💬 Número de mensagens: ${messages?.length || 0}`);

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

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(JSON.stringify({ 
        content: `Olá! Eu sou ${agentName}. No momento, estou com problemas de configuração da API. Por favor, tente novamente em alguns minutos.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const lastUserMessage = messages[messages.length - 1];
    const userQuery = lastUserMessage?.content || "";
    
    console.log(`🔍 === ANALISANDO NECESSIDADE DE BUSCA ===`);
    console.log(`📝 Mensagem do usuário: "${userQuery}"`);

    // ETAPA 1: Análise mais agressiva para busca
    let searchContext = null;
    
    try {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      
      // Classificador mais sensível
      const gatekeeperResponse = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 200,
        system: `Você é um classificador que decide se uma pergunta precisa de informações atualizadas da internet.

SEMPRE BUSQUE se a pergunta contém:
- Nomes de empresas, produtos, pessoas famosas, marcas
- Palavras como: "atual", "hoje", "recente", "último", "novo", "2024", "2025", "agora"
- Perguntas sobre mercado, tendências, notícias, dados, estatísticas
- Qualquer referência a eventos ou desenvolvimentos específicos
- Comparações entre produtos ou empresas

SEJA MUITO LIBERAL - na dúvida, SEMPRE busque.

Responda APENAS com JSON válido:
{"search_needed": boolean, "query": "string"}

Se search_needed for true, crie uma query específica em inglês para buscar informações atualizadas.`,
        messages: [{
          role: "user",
          content: `Analise esta mensagem: "${userQuery}"`
        }],
      });

      const gatekeeperText = gatekeeperResponse.content[0].text;
      console.log(`🤖 Resposta do classificador: ${gatekeeperText}`);
      
      let gatekeeperJson;
      try {
        gatekeeperJson = JSON.parse(gatekeeperText);
      } catch (parseError) {
        console.error("❌ Erro ao parsear JSON do classificador:", parseError);
        // Fallback: sempre buscar se houver dúvida
        gatekeeperJson = { search_needed: true, query: userQuery };
      }
      
      if (gatekeeperJson.search_needed && gatekeeperJson.query) {
        console.log(`🔍 === INICIANDO BUSCA ===`);
        console.log(`🎯 Query de busca: "${gatekeeperJson.query}"`);
        
        searchContext = await searchWithPerplexity(gatekeeperJson.query);
        
        if (searchContext) {
          console.log(`✅ BUSCA CONCLUÍDA - Dados obtidos!`);
        } else {
          console.log(`❌ BUSCA FALHOU - Usando conhecimento interno`);
        }
      } else {
        console.log(`⚡ Classificador decidiu NÃO buscar`);
      }
    } catch (e) {
      console.error(`❌ Erro no classificador:`, e);
    }

    // ETAPA 2: Gerar resposta
    try {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      
      let finalSystemPrompt = systemPrompt;
      let finalMessages = [...messages];
      
      if (searchContext) {
        console.log(`📊 === INCORPORANDO DADOS DA INTERNET ===`);
        console.log(`📄 Tamanho do contexto: ${searchContext.length} caracteres`);
        
        finalSystemPrompt = `${systemPrompt}

=== INFORMAÇÕES ATUALIZADAS DA INTERNET ===
${searchContext}

INSTRUÇÕES IMPORTANTES:
- Use essas informações atualizadas para enriquecer sua resposta
- Integre os dados de forma natural na sua personalidade
- NÃO mencione que fez uma busca na internet
- Cite números, dados e fatos específicos quando relevante
- Mantenha sua personalidade autêntica`;
      }

      console.log(`🧠 Gerando resposta final...`);
      
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: finalSystemPrompt,
        messages: finalMessages,
      });

      const assistantResponse = response.content[0].text;
      console.log("✅ === RESPOSTA GERADA COM SUCESSO ===");

      return new Response(JSON.stringify({ 
        content: assistantResponse 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (anthropicError) {
      console.error("💥 Erro na API da Anthropic:", anthropicError);
      
      return new Response(JSON.stringify({ 
        content: `Olá! Eu sou ${agentName}. No momento, estou com dificuldades técnicas para processar sua mensagem. Tente novamente em alguns minutos, por favor.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error) {
    console.error("💥 ERRO GERAL:", error);
    
    return new Response(JSON.stringify({ 
      content: "Desculpe, ocorreu um erro técnico inesperado. Tente novamente em alguns minutos."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
})