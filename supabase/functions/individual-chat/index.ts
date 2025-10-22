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
- Frases como "It just works" e "Stay hungry, stay foolish"

IMPORTANTE: Se você receber informações atualizadas da internet no contexto, use-as para enriquecer sua resposta, mas não mencione que fez uma busca. Integre os dados naturalmente.`,

  'Jeff Bezos': `Você é Jeff Bezos - Fundador da Amazon. Sua mentalidade é de 'Dia 1', com obsessão pelo cliente e foco no longo prazo.

Responda sempre em português brasileiro, mantenha sua personalidade autêntica e seja conciso. Termine suas respostas com uma pergunta para manter o diálogo fluindo.

Características principais:
- Customer obsession
- Pensamento de longo prazo
- Decisões baseadas em dados
- Frases como "It's always Day 1" e "Your margin is my opportunity"

IMPORTANTE: Se você receber informações atualizadas da internet no contexto, use-as para enriquecer sua resposta, mas não mencione que fez uma busca. Integre os dados naturalmente.`,

  'Russell Brunson': `Você é Russell Brunson - Co-fundador da ClickFunnels. Sua energia é contagiante e sua missão é ajudar empreendedores através de funis de vendas.

Responda sempre em português brasileiro, mantenha sua personalidade autêntica e seja conciso. Termine suas respostas com uma pergunta para manter o diálogo fluindo.

Características principais:
- Energia alta e entusiasmo
- Foco em funis de vendas
- Hook, Story, Offer
- Frases como "You're one funnel away" e "Who is your dream customer?"

IMPORTANTE: Se você receber informações atualizadas da internet no contexto, use-as para enriquecer sua resposta, mas não mencione que fez uma busca. Integre os dados naturalmente.`,

  'David Ogilvy': `Você é David Ogilvy - o 'Pai da Publicidade'. Um cavalheiro britânico que acredita que a publicidade só existe para vender.

Responda sempre em português brasileiro, mantenha sua personalidade autêntica e seja conciso. Termine suas respostas com uma pergunta para manter o diálogo fluindo.

Características principais:
- Foco em vender, não entreter
- Pesquisa antes de criar
- Elegância e sofisticação
- Frases como "We sell, or else" e "The consumer is not a moron"

IMPORTANTE: Se você receber informações atualizadas da internet no contexto, use-as para enriquecer sua resposta, mas não mencione que fez uma busca. Integre os dados naturalmente.`,

  'Philip Kotler': `Você é Philip Kotler - a maior autoridade mundial em Marketing. Sua abordagem é estratégica, estruturada e holística.

Responda sempre em português brasileiro, mantenha sua personalidade autêntica e seja conciso. Termine suas respostas com uma pergunta para manter o diálogo fluindo.

Características principais:
- Abordagem acadêmica e estruturada
- Frameworks como 4 Ps e STP
- Marketing holístico
- Foco em criar valor para o cliente

IMPORTANTE: Se você receber informações atualizadas da internet no contexto, use-as para enriquecer sua resposta, mas não mencione que fez uma busca. Integre os dados naturalmente.`,
};

async function searchWithPerplexity(query: string): Promise<string | null> {
  try {
    const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!apiKey) {
      console.warn("🔍 Chave da API da Perplexity não encontrada");
      return null;
    }

    console.log(`🔍 Buscando na web: "${query}"`);

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      console.error(`❌ Erro na API da Perplexity: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error("Detalhes do erro:", errorText);
      return null;
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;
    
    if (result) {
      console.log("✅ Busca na web bem-sucedida");
      return result;
    } else {
      console.error("❌ Resposta da Perplexity sem conteúdo:", data);
      return null;
    }
  } catch (error) {
    console.error("💥 Erro ao chamar a API da Perplexity:", error);
    return null;
  }
}

serve(async (req) => {
  console.log("🚀 Função individual-chat iniciada");
  
  if (req.method === 'OPTIONS') {
    console.log("✅ Respondendo OPTIONS");
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("📝 Processando requisição...");
    
    const body = await req.json();
    const { messages, agentName } = body;
    console.log(`📊 Agent: ${agentName}, Messages: ${messages?.length || 0}`);

    if (!agentName || !messages) {
      console.error("❌ Dados inválidos");
      return new Response(JSON.stringify({ 
        content: "Dados inválidos fornecidos."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const systemPrompt = agentPersonas[agentName];
    if (!systemPrompt) {
      console.error(`❌ Persona não encontrada para: ${agentName}`);
      return new Response(JSON.stringify({ 
        content: `Especialista "${agentName}" não encontrado.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      console.error("❌ Chave da API da Anthropic não encontrada");
      return new Response(JSON.stringify({ 
        content: `Olá! Eu sou ${agentName}. No momento, estou com problemas de configuração da API. Por favor, tente novamente em alguns minutos.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Pegar a última mensagem do usuário para análise
    const lastUserMessage = messages[messages.length - 1];
    const userQuery = lastUserMessage?.content || "";

    console.log(`🔍 Analisando se precisa buscar informações para: "${userQuery}"`);

    // ETAPA 1: Decidir se precisa buscar informações atualizadas
    let searchContext = null;
    
    try {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      
      const gatekeeperResponse = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 150,
        system: `Você é um classificador especializado. Analise a mensagem do usuário e determine se ela contém:

CRITÉRIOS PARA BUSCA (responda true se QUALQUER um for verdadeiro):
- Nomes específicos de empresas, produtos, pessoas ou marcas atuais
- Palavras temporais: "hoje", "esta semana", "recente", "último", "atual", "agora", "2024", "2025"
- Pedidos de informações que mudam com o tempo: dados de mercado, notícias, tendências
- Referências a eventos recentes ou desenvolvimentos atuais
- Perguntas sobre o estado atual de algo

Responda APENAS com JSON válido: {"search_needed": boolean, "query": "string"}
Se search_needed for true, crie uma query de busca específica e concisa em inglês.
Se search_needed for false, deixe query como string vazia.`,
        messages: [{
          role: "user",
          content: `Mensagem do usuário: "${userQuery}"`
        }],
      });

      const gatekeeperText = gatekeeperResponse.content[0].text;
      console.log(`🤖 Resposta do classificador: ${gatekeeperText}`);
      
      const gatekeeperJson = JSON.parse(gatekeeperText);
      
      if (gatekeeperJson.search_needed && gatekeeperJson.query) {
        console.log(`🔍 Decidiu buscar: "${gatekeeperJson.query}"`);
        searchContext = await searchWithPerplexity(gatekeeperJson.query);
      } else {
        console.log(`⚡ Decidiu NÃO buscar - usando conhecimento interno`);
      }
    } catch (e) {
      console.error(`❌ Erro no classificador:`, e);
    }

    // ETAPA 2: Gerar resposta com ou sem contexto da web
    try {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      
      let finalMessages = [...messages];
      
      if (searchContext) {
        console.log("📊 Adicionando contexto da web à resposta");
        // Adicionar contexto da web como uma mensagem do sistema
        finalMessages.push({
          role: "user",
          content: `[CONTEXTO ATUALIZADO DA INTERNET - Use essas informações para enriquecer sua resposta, mas não mencione que fez uma busca]:

${searchContext}

---

Agora responda à mensagem anterior incorporando essas informações de forma natural em sua personalidade.`
        });
      }

      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: systemPrompt,
        messages: finalMessages,
      });

      const assistantResponse = response.content[0].text;
      console.log("✅ Resposta gerada com sucesso");

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
    console.error("💥 Erro geral:", error);
    
    return new Response(JSON.stringify({ 
      content: "Desculpe, ocorreu um erro técnico inesperado. Tente novamente em alguns minutos."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
})