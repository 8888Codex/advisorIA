import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("🔧 FUNÇÃO DE ATIVAÇÃO - VERSÃO SIMPLIFICADA");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { action } = body;

    console.log(`📋 Ação solicitada: ${action}`);

    if (action === 'check_status') {
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

    if (action === 'test_connection') {
      const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
      
      if (!apiKey) {
        return new Response(JSON.stringify({
          success: false,
          error: "PERPLEXITY_API_KEY não encontrada nos segredos do Supabase"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }

      try {
        console.log("🧪 Testando conexão com a Perplexity...");
        
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
                content: "What is the latest iPhone model from Apple in 2024? Include iPhone 16 details."
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
            error: `Erro da API Perplexity: ${response.status} - ${errorText}`
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
            error: "Resposta vazia da API"
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          });
        }

        console.log("✅ Teste de conexão bem-sucedido!");
        
        return new Response(JSON.stringify({
          success: true,
          message: "Conexão com a API da Perplexity estabelecida com sucesso!",
          test_result: result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });

      } catch (error) {
        console.error("💥 Erro na conexão:", error);
        
        return new Response(JSON.stringify({
          success: false,
          error: `Erro de conexão: ${error.message}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
    }

    // Ação não reconhecida
    return new Response(JSON.stringify({
      success: false,
      error: "Ação não reconhecida. Use 'check_status' ou 'test_connection'"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });

  } catch (error) {
    console.error("💥 ERRO CRÍTICO na função de ativação:", error);
    return new Response(JSON.stringify({
      success: false,
      error: `Erro crítico: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
})