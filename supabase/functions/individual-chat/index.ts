import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("🚀 Função individual-chat iniciada");
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log("✅ Respondendo OPTIONS");
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("📝 Processando requisição...");
    
    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("✅ Body parseado:", JSON.stringify(body));
    } catch (e) {
      console.error("❌ Erro ao parsear body:", e);
      return new Response(JSON.stringify({ 
        error: "Erro ao parsear dados da requisição" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { messages, agentName } = body;
    console.log(`📊 Agent: ${agentName}, Messages: ${messages?.length || 0}`);

    // Validate input
    if (!agentName || !messages) {
      console.error("❌ Dados inválidos");
      return new Response(JSON.stringify({ 
        error: "Nome do especialista e mensagens são obrigatórios." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // For now, return a simple response to test
    const testResponse = `Olá! Eu sou ${agentName}. Recebi sua mensagem e estou processando. Esta é uma resposta de teste para verificar se a função está funcionando corretamente.`;
    
    console.log("✅ Retornando resposta de teste");
    
    return new Response(JSON.stringify({ 
      content: testResponse 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("💥 Erro geral:", error);
    console.error("Stack trace:", error.stack);
    
    return new Response(JSON.stringify({ 
      error: `Erro interno: ${error.message}`,
      details: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
})