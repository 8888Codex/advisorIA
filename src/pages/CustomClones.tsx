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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [clones, setClones] = useState<CustomAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false);
  const [editingClone, setEditingClone] = useState<CustomAgent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      toast.loading('Passo 1/2: Pesquisando e gerando a persona base...', { id: toastId });
      const { data: personaData, error: personaError } = await supabase.functions.invoke('generate-persona', {
        body: { name },
      });

      if (personaError) throw personaError;
      if (personaData.error) throw new Error(`Etapa 1 falhou: ${personaData.error}`);

      toast.loading('Passo 2/2: Refinando a estrutura da persona...', { id: toastId });
      const { data: refinedData, error: refinedError } = await supabase.functions.invoke('refine-persona', {
        body: { personaText: personaData.persona, agentName: name },
      });

      if (refinedError) throw refinedError;
      if (refinedData.error) throw new Error(`Etapa 2 falhou: ${refinedData.error}`);

      form.setValue('persona', refinedData.refinedPersona, { shouldValidate: true });
      toast.success('Persona gerada e refinada com sucesso!', { id: toastId });
    } catch (error: any) {
      let detail = "Ocorreu um erro desconhecido.";
      if (error.context && error.context.error) {
        detail = error.context.error;
      } else if (error.message) {
        detail = error.message;
      }
      toast.error(`Falha ao gerar a persona: ${detail}`, { id: toastId, duration: 10000 });
      console.error("Detailed persona generation error:", error);
    } finally {
      setIsGeneratingPersona(false);
    }
  };

  const handleOpenDialog = (clone: CustomAgent | null) => {
    setEditingClone(clone);
    if (clone) {
      form.reset({
        name: clone.name,
        title: clone.title || '',
        description: clone.description || '',
        emoji: clone.emoji || '',
        persona: clone.persona,
      });
    } else {
      form.reset({ name: '', title: '', description: '', emoji: '', persona: '' });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof cloneSchema>) => {
    setIsSubmitting(true);
    try {
      let response;
      if (editingClone) {
        response = await supabase.from('custom_agents').update(values).eq('id', editingClone.id).select().single();
      } else {
        response = await supabase.from('custom_agents').insert(values).select().single();
      }

      if (response.error) throw response.error;
      const savedClone = response.data;

      toast.success(`Clone "${savedClone.name}" salvo com sucesso!`, {
        action: {
          label: "Testar Clone",
          onClick: () => navigate(`/chat?agentId=${savedClone.id}`),
        },
      });

      setIsDialogOpen(false);
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Clones Customizados</h1>
          <p className="text-muted-foreground mt-1">Crie, edite e gerencie seus próprios especialistas de IA.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Novo Clone
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingClone ? `Editando "${editingClone.name}"` : 'Criar Novo Clone'}</DialogTitle>
              <CardDescription>{editingClone ? 'Ajuste os detalhes do seu clone abaixo.' : 'Defina a personalidade e o conhecimento do seu especialista de IA.'}</CardDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
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
                    <FormControl><Textarea placeholder="Descreva o tom de voz, a área de conhecimento, o estilo de resposta e as regras que este clone deve seguir..." rows={10} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingClone ? 'Salvar Alterações' : 'Criar Clone'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> Sua Lista de Clones</CardTitle>
          <CardDescription>Gerencie os especialistas que você criou.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : clones.length > 0 ? (
            <div className="space-y-4">
              {clones.map(clone => (
                <div key={clone.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{clone.emoji || '🤖'}</span>
                    <div>
                      <p className="font-semibold">{clone.name}</p>
                      <p className="text-sm text-muted-foreground">{clone.title || 'Sem título'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => handleOpenDialog(clone)}><Pencil className="h-4 w-4" /></Button>
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
              <p>Clique em "Criar Novo Clone" para começar.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomClones;