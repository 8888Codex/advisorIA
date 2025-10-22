import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Log para confirmar a versão da função
  console.log("--- DEPLOYMENT CHECK: VERSION 6 (Bypass Test) ---");
  console.log("--- Esta versão ignora completamente a API da Perplexity. ---");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Esta função agora ignora a chamada à API da Perplexity para testar se os deploys estão funcionando.
    // Ela sempre retornará uma mensagem de sucesso.
    
    const successMessage = "Teste de bypass bem-sucedido! O deploy da função está funcionando. Agora podemos reativar a API.";

    console.log("[V6] Teste de bypass bem-sucedido. Retornando mensagem fixa.");

    return new Response(JSON.stringify({ 
      success: true, 
      result: successMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200
    });

  } catch (error) {
    // Este bloco de erro não deve ser alcançado nesta versão.
    console.error(`[V6] Ocorreu um erro crítico, o que é inesperado no modo de bypass: ${error.message}`);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Erro Crítico no Modo Bypass: ${error.message}`
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500 
    });
  }
})