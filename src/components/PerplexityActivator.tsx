import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Globe, Key, TestTube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface APIStatus {
  api_key_configured: boolean;
  api_key_length: number;
  api_key_preview: string | null;
  environment: string;
  timestamp: string;
}

const PerplexityActivator = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<APIStatus | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔍 Verificando status da API...");
      
      const { data, error } = await supabase.functions.invoke('activate-perplexity', {
        body: { action: 'check_status' }
      });

      console.log("📊 Resposta do status:", data);
      console.log("❌ Erro do status:", error);

      if (error) {
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (data?.success) {
        setStatus(data.status);
        showSuccess('Status da API verificado com sucesso!');
      } else {
        throw new Error(data?.error || 'Erro desconhecido ao verificar status');
      }
    } catch (err: any) {
      console.error("💥 Erro ao verificar status:", err);
      setError(err.message);
      showError(`Erro ao verificar status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      console.log("🧪 Testando conexão...");
      
      const { data, error } = await supabase.functions.invoke('activate-perplexity', {
        body: { action: 'test_connection' }
      });

      console.log("📊 Resposta do teste:", data);
      console.log("❌ Erro do teste:", error);

      if (error) {
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (data?.success) {
        setTestResult(data.test_result);
        showSuccess('🎉 Conexão com a internet funcionando! Os clones agora têm acesso a dados atualizados.');
      } else {
        throw new Error(data?.error || 'Erro desconhecido no teste de conexão');
      }
    } catch (err: any) {
      console.error("💥 Erro no teste de conexão:", err);
      setError(err.message);
      showError(`Erro no teste de conexão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Ativador da API Perplexity
        </CardTitle>
        <CardDescription>
          Configure e teste a conexão com a internet para os clones de IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botões de Ação */}
        <div className="flex gap-2">
          <Button 
            onClick={checkStatus} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
            Verificar Status
          </Button>
          
          <Button 
            onClick={testConnection} 
            disabled={loading}
            size="sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
            Testar Conexão
          </Button>
        </div>

        {/* Exibir Status */}
        {status && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>Status da Chave:</span>
                  <Badge variant={status.api_key_configured ? "default" : "destructive"}>
                    {status.api_key_configured ? "Configurada" : "Não Configurada"}
                  </Badge>
                </div>
                {status.api_key_configured && (
                  <div className="text-sm text-muted-foreground">
                    Chave: {status.api_key_preview} ({status.api_key_length} caracteres)
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Resultado do Teste */}
        {testResult && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold text-green-700">✅ Teste de Conexão Bem-Sucedido!</div>
                <div className="text-sm bg-green-50 p-3 rounded border">
                  <strong>Resultado da busca:</strong>
                  <p className="mt-1">{testResult}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold">❌ Erro na Conexão</div>
                <div className="text-sm">{error}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  <strong>Solução:</strong> Verifique se a PERPLEXITY_API_KEY está configurada corretamente nos segredos do Supabase.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Instruções */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Como usar:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Clique em "Verificar Status" para ver se a chave da API está configurada</li>
            <li>Clique em "Testar Conexão" para verificar se a busca na internet está funcionando</li>
            <li>Se o teste passar, os clones terão acesso a informações atualizadas da internet</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerplexityActivator;