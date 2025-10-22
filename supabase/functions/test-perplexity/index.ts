import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("🧪 === TESTE DA API PERPLEXITY INICIADO ===")
  
  try {
    // Verificar se a chave existe
    const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
    console.log(`🔑 API Key encontrada: ${apiKey ? 'SIM' : 'NÃO'}`);
    
    if (!apiKey) {
      console.error("❌ PERPLEXITY_API_KEY não encontrada");
      return new Response(JSON.stringify({ 
        success: false,
        error: "PERPLEXITY_API_KEY não encontrada nos segredos do Supabase"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`🔑 Primeiros caracteres da chave: ${apiKey.substring(0, 8)}...`);

    // Teste simples da API
    console.log("🌐 Testando conexão com Perplexity...");
    
    const testQuery = "What is the latest iPhone model from Apple in 2024?";
    console.log(`📝 Query de teste: "${testQuery}"`);

    const requestBody = {
      model: "llama-3.1-sonar-large-128k-online",
      messages: [
        {
          role: "user", 
          content: testQuery
        }
      ],
      max_tokens: 500,
      temperature: 0.1,
    };

    console.log("📤 Enviando requisição para Perplexity...");

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
      
      return new Response(JSON.stringify({ 
        success: false,
        error: `Erro HTTP ${response.status}: ${errorText}`,
        status: response.status,
        statusText: response.statusText
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;
    
    console.log("✅ RESPOSTA RECEBIDA COM SUCESSO!");
    console.log(`📊 Conteúdo (${result?.length || 0} caracteres)`);
    console.log(`📄 Resultado: ${result}`);

    return new Response(JSON.stringify({ 
      success: true,
      result: result,
      message: "API da Perplexity funcionando perfeitamente!",
      query: testQuery,
      responseLength: result?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("💥 ERRO CRÍTICO:", error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: `Erro crítico: ${error.message}`,
      type: "CRITICAL_ERROR"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
})