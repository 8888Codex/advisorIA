import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("🚀 TESTE PERPLEXITY - Versão com Query Específica");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const body = await req.json();
    const { query } = body;
    
    const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!apiKey) {
      throw new Error("PERPLEXITY_API_KEY não encontrada nos segredos do Supabase");
    }

    // Query mais específica para obter dados atuais
    const searchQuery = query || "What is the newest iPhone model released by Apple in 2024? Include the iPhone 16 series details.";
    console.log(`🔍 Fazendo busca específica: "${searchQuery}"`);

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
            content: "You are a research assistant. Provide the most current and accurate information available. Focus on recent releases and current data from 2024."
          },
          {
            role: "user", 
            content: searchQuery
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro HTTP ${response.status}:`, errorText);
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;
    
    if (!result) {
      throw new Error("Resposta vazia da API da Perplexity");
    }

    console.log("✅ Busca na Perplexity bem-sucedida!");
    console.log(`📄 Resultado: ${result}`);

    return new Response(JSON.stringify({ 
      success: true, 
      result: result,
      query_used: searchQuery
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200
    });

  } catch (error) {
    console.error(`💥 ERRO:`, error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500 
    });
  }
})