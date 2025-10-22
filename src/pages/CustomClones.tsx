import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Bot, Trash2, Loader2, Inbox, Sparkles, Pencil } from 'lucide-react';
import { showSuccess, showError, showLoading } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

const cloneSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  title: z.string().optional(),
  description: z.string().optional(),
  emoji: z.string().optional(),
  persona: z.string().min(50, { message: 'A persona deve ter pelo menos 50 caracteres para ser eficaz.' }),
});

export interface CustomAgent {
  id: string;
  name: string;
  title?: string;
  description?: string;
  emoji?: string;
  persona: string;
  created_at: string;
}

const CustomClones = () => {
  const { session, supabase } = useSession();
  const [clones, setClones] = useState<CustomAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false);
  const [editingClone, setEditingClone] = useState<CustomAgent | null>(null);

  const form = useForm<z.infer<typeof cloneSchema>>({
    resolver: zodResolver(cloneSchema),
    defaultValues: { name: '', title: '', description: '', emoji: '', persona: '' },
  });

  const fetchClones = async () => {
    if (!session?.user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_agents')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setClones(data || []);
    } catch (error) {
      showError('Falha ao carregar seus clones.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClones();
  }, [session]);

  const handleGeneratePersona = async () => {
    const name = form.getValues('name');
    if (!name) {
      showError('Por favor, insira um nome para o clone primeiro.');
      return;
    }
    setIsGeneratingPersona(true);
    const toastId = showLoading('Iniciando geração de persona...');
    try {
      // Step 1: Generate the base persona
      toast.loading('Passo 1/2: Pesquisando e gerando a persona base...', { id: toastId });
      const { data: personaData, error: personaError } = await supabase.functions.invoke('generate-persona', {
        body: { name },
      });

      if (personaError) {
        const errorMessage = personaError.context?.error || personaError.message;
        throw new Error(`Etapa 1 falhou: ${errorMessage}`);
      }
      if (personaData.error) throw new Error(`Etapa 1 falhou: ${personaData.error}`);

      // Step 2: Refine the persona
      toast.loading('Passo 2/2: Refinando a estrutura da persona...', { id: toastId });
      const { data: refinedData, error: refinedError } = await supabase.functions.invoke('refine-persona', {
        body: { personaText: personaData.persona, agentName: name },
      });

      if (refinedError) {
        const errorMessage = refinedError.context?.error || refinedError.message;
        throw new Error(`Etapa 2 falhou: ${errorMessage}`);
      }
      if (refinedData.error) throw new Error(`Etapa 2 falhou: ${refinedData.error}`);

      form.setValue('persona', refinedData.refinedPersona, { shouldValidate: true });
      toast.success('Persona gerada e refinada com sucesso!', { id: toastId });
    } catch (error: any) {
      const detail = error.message || 'Ocorreu um erro desconhecido.';
      toast.error(`Falha ao gerar a persona: ${detail}`, { id: toastId });
      console.error("Detailed persona generation error:", error);
    } finally {
      setIsGeneratingPersona(false);
    }
  };

  const handleEdit = (clone: CustomAgent) => {
    setEditingClone(clone);
    form.reset({
      name: clone.name,
      title: clone.title || '',
      description: clone.description || '',
      emoji: clone.emoji || '',
      persona: clone.persona,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingClone(null);
    form.reset({ name: '', title: '', description: '', emoji: '', persona: '' });
  };

  const onSubmit = async (values: z.infer<typeof cloneSchema>) => {
    setIsSubmitting(true);
    try {
      if (editingClone) {
        const { error } = await supabase.from('custom_agents').update(values).eq('id', editingClone.id);
        if (error) throw error;
        showSuccess('Clone atualizado com sucesso!');
        setEditingClone(null);
      } else {
        const { error } = await supabase.from('custom_agents').insert(values);
        if (error) throw error;
        showSuccess('Clone criado com sucesso!');
      }
      form.reset();
      fetchClones();
    } catch (error) {
      showError(editingClone ? 'Falha ao atualizar o clone.' : 'Falha ao criar o clone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteClone = async (cloneId: string) => {
    try {
      const { error } = await supabase.from('custom_agents').delete().eq('id', cloneId);
      if (error) throw error;
      showSuccess('Clone excluído com sucesso.');
      fetchClones();
    } catch (error) {
      showError('Falha ao excluir o clone.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingClone ? <Pencil className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
              {editingClone ? `Editando "${editingClone.name}"` : 'Criar Novo Clone'}
            </CardTitle>
            <CardDescription>
              {editingClone ? 'Ajuste os detalhes do seu clone abaixo.' : 'Defina a personalidade e o conhecimento do seu especialista de IA.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="sm:col-span-2"><FormLabel>Nome do Clone</FormLabel><FormControl><Input placeholder="Ex: Steve Jobs" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="emoji" render={({ field }) => (
                    <FormItem><FormLabel>Emoji</FormLabel><FormControl><Input placeholder="💡" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormDescription>Insira o nome de uma figura pública para gerar a persona.</FormDescription></FormItem>
                )} />
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Cargo / Título</FormLabel><FormControl><Input placeholder="Ex: Co-fundador da Apple" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Descrição Curta</FormLabel><FormControl><Textarea placeholder="Descreva o propósito principal deste clone em uma frase." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="persona" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Persona / Instruções</FormLabel>
                      <Button type="button" variant="outline" size="sm" onClick={handleGeneratePersona} disabled={!form.watch('name') || isGeneratingPersona}>
                        {isGeneratingPersona ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Gerar com IA
                      </Button>
                    </div>
                    <FormControl><Textarea placeholder="Descreva o tom de voz, a área de conhecimento, o estilo de resposta e as regras que este clone deve seguir..." rows={15} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex gap-2">
                  {editingClone && <Button type="button" variant="outline" className="w-full" onClick={cancelEdit}>Cancelar</Button>}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? (editingClone ? 'Atualizando...' : 'Criando...') : (editingClone ? 'Atualizar Clone' : 'Criar Clone')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> Seus Clones Customizados</CardTitle>
            <CardDescription>Gerencie os especialistas que você criou.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : clones.length > 0 ? (
              <div className="space-y-4">
                {clones.map(clone => (
                  <div key={clone.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{clone.emoji || '🤖'}</span>
                      <div>
                        <p className="font-semibold">{clone.name}</p>
                        <p className="text-sm text-muted-foreground">{clone.title || 'Sem título'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => handleEdit(clone)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Excluir "{clone.name}"?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. O clone será removido permanentemente.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteClone(clone.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                <Inbox className="h-12 w-12 mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-foreground">Nenhum clone encontrado</h3>
                <p>Use o formulário ao lado para criar seu primeiro especialista.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomClones;