import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Log para confirmar a versão da função
  console.log("--- DEPLOYMENT CHECK: VERSION 5 ---");
  console.log("--- Model: llama-3-sonar-small-32k-online ---");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!apiKey) {
      console.log("[V5] Error: PERPLEXITY_API_KEY not found in environment secrets.");
      return new Response(JSON.stringify({ 
        success: false, error: "PERPLEXITY_API_KEY not found"
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    const testQuery = "What is the latest iPhone model from Apple?";
    const modelToUse = "llama-3-sonar-small-32k-online";

    const requestBody = {
      model: modelToUse,
      messages: [{ role: "user", content: testQuery }],
    };

    console.log(`[V5] Attempting to call Perplexity with model: ${modelToUse}`);

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[V5] Perplexity API returned an error. Status: ${response.status}. Body: ${errorText}`);
      return new Response(JSON.stringify({ 
        success: false, error: `Perplexity API Error: ${errorText}`
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;
    
    console.log("[V5] Success! Perplexity API call was successful.");
    return new Response(JSON.stringify({ success: true, result: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error) {
    console.error(`[V5] A critical error occurred: ${error.message}`);
    return new Response(JSON.stringify({ 
      success: false, error: `Critical Error: ${error.message}`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  }
})