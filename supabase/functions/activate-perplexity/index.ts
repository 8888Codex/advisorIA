import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("🔧 FUNÇÃO DE ATIVAÇÃO DA PERPLEXITY API");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { action, apiKey, testQuery } = body;

    switch (action) {
      case 'check_status':
        return await checkAPIStatus();
      
      case 'test_connection':
        return await testConnection(testQuery || "What is the latest iPhone model from Apple in 2024?");
      
      case 'validate_key':
        return await validateAPIKey(apiKey);
      
      default:
        return new Response(JSON.stringify({
          success: false,
          error: "Ação inválida. Use: check_status, test_connection, ou validate_key"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
    }

  } catch (error) {
    console.error("💥 ERRO na função de ativação:", error);
    return new Response(JSON.stringify({
      success: false,
      error: `Erro crítico: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
})

async function checkAPIStatus() {
  const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
  
  return new Response(JSON.stringify({
    success: true,
    status: {
      api_key_configured: !!apiKey,
      api_key_length: apiKey ? apiKey.length : 0,
      api_key_preview: apiKey ? `${apiKey.substring(0, 8)}...` : null,
      environment: "Supabase Edge Functions",
      timestamp: new Date().toISOString()
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  });
}

async function testConnection(query: string) {
  const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
  
  if (!apiKey) {
    return new Response(JSON.stringify({
      success: false,
      error: "PERPLEXITY_API_KEY não encontrada nos segredos do Supabase",
      solution: "Configure a chave da API no painel do Supabase: Project Settings > Edge Functions > Secrets"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }

  try {
    console.log(`🧪 Testando conexão com query: "${query}"`);
    
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
            content: "You are a research assistant. Provide current and accurate information."
          },
          {
            role: "user",
            content: query
          }
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro da API: ${response.status} - ${errorText}`);
      
      return new Response(JSON.stringify({
        success: false,
        error: `Erro da API Perplexity: ${response.status}`,
        details: errorText,
        troubleshooting: {
          status_401: "Chave da API inválida ou expirada",
          status_429: "Limite de rate excedido",
          status_400: "Modelo ou parâmetros inválidos"
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      return new Response(JSON.stringify({
        success: false,
        error: "Resposta vazia da API",
        raw_response: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log("✅ Teste de conexão bem-sucedido!");
    
    return new Response(JSON.stringify({
      success: true,
      message: "Conexão com a API da Perplexity estabelecida com sucesso!",
      test_result: result,
      query_used: query,
      model_used: "llama-3-sonar-large-32k-online",
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error("💥 Erro na conexão:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: `Erro de conexão: ${error.message}`,
      type: "network_error"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }
}

async function validateAPIKey(providedKey?: string) {
  const currentKey = Deno.env.get("PERPLEXITY_API_KEY");
  const keyToTest = providedKey || currentKey;
  
  if (!keyToTest) {
    return new Response(JSON.stringify({
      success: false,
      error: "Nenhuma chave da API fornecida para validação"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }

  try {
    // Teste simples com uma query mínima
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${keyToTest}`,
      },
      body: JSON.stringify({
        model: "llama-3-sonar-large-32k-online",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10,
      }),
    });

    const isValid = response.ok;
    const statusCode = response.status;
    
    return new Response(JSON.stringify({
      success: true,
      validation: {
        is_valid: isValid,
        status_code: statusCode,
        key_format: keyToTest.startsWith('pplx-') ? 'correct' : 'incorrect',
        key_length: keyToTest.length,
        message: isValid ? "Chave da API válida!" : "Chave da API inválida ou com problemas"
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: `Erro na validação: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }
}