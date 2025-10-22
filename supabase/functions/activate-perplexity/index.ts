import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function is now the main handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { action } = body;
    console.log(`[ACTIVATE_FN] Received action: ${action}`);

    if (action === 'check_status') {
      return checkStatus();
    }

    if (action === 'test_connection') {
      return testConnection();
    }

    // If action is not recognized
    return new Response(JSON.stringify({
      success: false,
      error: `Ação não reconhecida: ${action}. Use 'check_status' ou 'test_connection'.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 // Return 200 OK to avoid client-side crash
    });

  } catch (error) {
    console.error("💥 [ACTIVATE_FN] Erro crítico ao processar a requisição:", error);
    // This error happens if req.json() fails or something fundamental breaks
    return new Response(JSON.stringify({
      success: false,
      error: `Erro crítico na função: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 // A 500 is appropriate for a server-level crash
    });
  }
})

// Helper function for checking status
function checkStatus() {
  console.log("[ACTIVATE_FN] Executando checkStatus...");
  const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
  
  const statusPayload = {
    success: true,
    status: {
      api_key_configured: !!apiKey,
      api_key_length: apiKey ? apiKey.length : 0,
      api_key_preview: apiKey ? `${apiKey.substring(0, 8)}...` : null,
    }
  };
  console.log("[ACTIVATE_FN] Status verificado:", statusPayload.status);
  
  return new Response(JSON.stringify(statusPayload), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  });
}

// Helper function for testing the connection
async function testConnection() {
  console.log("[ACTIVATE_FN] Executando testConnection...");
  const apiKey = Deno.env.get("PERPLEXITY_API_KEY");

  if (!apiKey) {
    console.log("[ACTIVATE_FN] Erro: Chave da API não configurada.");
    return new Response(JSON.stringify({
      success: false,
      error: "PERPLEXITY_API_KEY não encontrada nos segredos do Supabase."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 // Return 200 OK
    });
  }

  try {
    console.log("[ACTIVATE_FN] Enviando requisição para a Perplexity API...");
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3-sonar-small-32k-online",
        messages: [{ role: "user", content: "What is the latest iPhone model in 2024?" }],
        max_tokens: 100,
      }),
    });

    console.log(`[ACTIVATE_FN] Perplexity API respondeu com status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ACTIVATE_FN] Erro da API Perplexity:", errorText);
      return new Response(JSON.stringify({
        success: false,
        error: `Erro da API Perplexity (Status: ${response.status})`,
        details: errorText
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 OK
      });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      console.log("[ACTIVATE_FN] Erro: Resposta da API vazia.");
      return new Response(JSON.stringify({
        success: false,
        error: "Resposta da API da Perplexity veio vazia."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 OK
      });
    }

    console.log("[ACTIVATE_FN] Teste de conexão bem-sucedido!");
    return new Response(JSON.stringify({
      success: true,
      message: "Conexão com a API da Perplexity estabelecida com sucesso!",
      test_result: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error("💥 [ACTIVATE_FN] Erro durante a chamada fetch:", error);
    return new Response(JSON.stringify({
      success: false,
      error: `Erro de rede ao tentar conectar com a Perplexity: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 // Return 200 OK
    });
  }
}