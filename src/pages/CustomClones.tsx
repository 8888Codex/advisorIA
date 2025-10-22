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
import { PlusCircle, Bot, Trash2, Loader2, Inbox } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const cloneSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  title: z.string().optional(),
  description: z.string().optional(),
  persona: z.string().min(50, { message: 'A persona deve ter pelo menos 50 caracteres para ser eficaz.' }),
});

export interface CustomAgent {
  id: string;
  name: string;
  title?: string;
  description?: string;
  persona: string;
  created_at: string;
}

const CustomClones = () => {
  const { session, supabase } = useSession();
  const [clones, setClones] = useState<CustomAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof cloneSchema>>({
    resolver: zodResolver(cloneSchema),
    defaultValues: { name: '', title: '', description: '', persona: '' },
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

  const onSubmit = async (values: z.infer<typeof cloneSchema>) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('custom_agents').insert(values);
      if (error) throw error;
      showSuccess('Clone criado com sucesso!');
      form.reset();
      fetchClones(); // Refresh the list
    } catch (error) {
      showError('Falha ao criar o clone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteClone = async (cloneId: string) => {
    try {
      const { error } = await supabase.from('custom_agents').delete().eq('id', cloneId);
      if (error) throw error;
      showSuccess('Clone excluído com sucesso.');
      fetchClones(); // Refresh the list
    } catch (error) {
      showError('Falha ao excluir o clone.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PlusCircle className="h-5 w-5" /> Criar Novo Clone</CardTitle>
            <CardDescription>Defina a personalidade e o conhecimento do seu especialista de IA.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nome do Clone</FormLabel><FormControl><Input placeholder="Ex: Especialista em Marketing" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Cargo / Título</FormLabel><FormControl><Input placeholder="Ex: Diretor de Crescimento" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Descrição Curta</FormLabel><FormControl><Textarea placeholder="Descreva o propósito principal deste clone em uma frase." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="persona" render={({ field }) => (
                  <FormItem><FormLabel>Persona / Instruções</FormLabel><FormControl><Textarea placeholder="Seja detalhado. Descreva o tom de voz, a área de conhecimento, o estilo de resposta e as regras que este clone deve seguir..." rows={10} {...field} /></FormControl><FormDescription>Esta é a instrução principal que guiará seu clone.</FormDescription><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Criando...' : 'Criar Clone'}
                </Button>
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
                    <div>
                      <p className="font-semibold">{clone.name}</p>
                      <p className="text-sm text-muted-foreground">{clone.title || 'Sem título'}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Excluir "{clone.name}"?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. O clone será removido permanentemente.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteClone(clone.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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