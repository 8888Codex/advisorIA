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
        error: "Nome do especialista e mensagens são obrigatórios." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const systemPrompt = agentPersonas[agentName];
    if (!systemPrompt) {
      console.error(`❌ Persona não encontrada para: ${agentName}`);
      return new Response(JSON.stringify({ 
        error: `Especialista "${agentName}" não encontrado.` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Check if Anthropic API key exists
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

    console.log("🧠 Chamando Anthropic...");
    
    try {
      const anthropic = new Anthropic({
        apiKey: anthropicKey,
      });

      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages,
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
        content: `Olá! Eu sou ${agentName}. No momento, estou com dificuldades técnicas para processar sua mensagem. Isso pode ser um problema temporário com minha IA. Tente novamente em alguns minutos, por favor.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error) {
    console.error("💥 Erro geral:", error);
    
    return new Response(JSON.stringify({ 
      content: "Desculpe, ocorreu um erro técnico inesperado. Nossa equipe foi notificada e está trabalhando para resolver. Tente novamente em alguns minutos."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
})