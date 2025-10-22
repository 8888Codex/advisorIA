import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Log para confirmar a versão da função
  console.log(">>> EXECUTANDO VERSÃO 3 DA FUNÇÃO DE TESTE <<<");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        success: false, error: "PERPLEXITY_API_KEY não encontrada"
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    const testQuery = "What is the latest iPhone model from Apple in 2024?";
    const modelToUse = "llama-3-sonar-small-32k-online"; // NOVO MODELO VÁLIDO

    const requestBody = {
      model: modelToUse,
      messages: [{ role: "user", content: testQuery }],
    };

    console.log(`🤖 Usando o modelo: ${modelToUse}`);

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ 
        success: false, error: `Erro HTTP ${response.status}: ${errorText}`
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;
    
    return new Response(JSON.stringify({ success: true, result: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, error: `Erro crítico: ${error.message}`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  }
})