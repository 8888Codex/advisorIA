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
import { PlusCircle, Bot, Trash2, Loader2, Inbox, Sparkles, Pencil, Upload, MoreVertical } from 'lucide-react';
import { showSuccess, showError, showLoading } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';

const cloneSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  title: z.string().optional(),
  description: z.string().optional(),
  emoji: z.string().optional(),
  persona: z.string().min(50, { message: 'A persona deve ter pelo menos 50 caracteres para ser eficaz.' }),
  avatar_url: z.string().optional(),
});

export interface CustomAgent {
  id: string;
  name: string;
  title?: string;
  description?: string;
  emoji?: string;
  avatar_url?: string;
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
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof cloneSchema>>({
    resolver: zodResolver(cloneSchema),
    defaultValues: { name: '', title: '', description: '', emoji: '', persona: '', avatar_url: '' },
  });

  const fetchClones = async () => {
    if (!session?.user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('custom_agents').select('*').order('created_at', { ascending: false });
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !session?.user) return;
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${session.user.id}/${Math.random()}.${fileExt}`;

    setIsUploading(true);
    try {
      const { error: uploadError } = await supabase.storage.from('clone-avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('clone-avatars').getPublicUrl(filePath);
      
      form.setValue('avatar_url', publicUrl);
      showSuccess('Avatar carregado com sucesso!');
    } catch (error) {
      showError('Falha ao carregar o avatar. Verifique se o bucket "clone-avatars" existe e é público.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGeneratePersona = async () => {
    const name = form.getValues('name');
    if (!name) {
      showError('Por favor, insira um nome para o clone primeiro.');
      return;
    }
    setIsGeneratingPersona(true);
    const toastId = showLoading('Gerando persona completa...');
    try {
      const { data, error } = await supabase.functions.invoke('generate-structured-persona', { body: { name } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      form.setValue('title', data.title, { shouldValidate: true });
      form.setValue('description', data.description, { shouldValidate: true });
      form.setValue('emoji', data.emoji, { shouldValidate: true });
      form.setValue('persona', data.persona, { shouldValidate: true });

      toast.success('Todos os campos foram preenchidos com IA!', { id: toastId });
    } catch (error: any) {
      let detail = "Ocorreu um erro desconhecido.";
      if (error.context && error.context.error) detail = error.context.error;
      else if (error.message) detail = error.message;
      toast.error(`Falha ao gerar a persona: ${detail}`, { id: toastId, duration: 10000 });
      console.error("Detailed persona generation error:", error);
    } finally {
      setIsGeneratingPersona(false);
    }
  };

  const handleOpenDialog = (clone: CustomAgent | null) => {
    setEditingClone(clone);
    form.reset(clone || { name: '', title: '', description: '', emoji: '', persona: '', avatar_url: '' });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof cloneSchema>) => {
    if (!session?.user) {
      showError('Você precisa estar logado para criar um clone.');
      return;
    }
    setIsSubmitting(true);
    try {
      let response;
      if (editingClone) {
        response = await supabase.from('custom_agents').update(values).eq('id', editingClone.id).select().single();
      } else {
        response = await supabase.from('custom_agents').insert({ ...values, user_id: session.user.id }).select().single();
      }
      if (response.error) throw response.error;
      const savedClone = response.data;
      toast.success(`Clone "${savedClone.name}" salvo com sucesso!`, {
        action: { label: "Testar Clone", onClick: () => navigate(`/chat?agentId=${savedClone.id}`) },
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
          <DialogTrigger asChild><Button onClick={() => handleOpenDialog(null)}><PlusCircle className="mr-2 h-4 w-4" />Criar Novo Clone</Button></DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingClone ? `Editando "${editingClone.name}"` : 'Criar Novo Clone'}</DialogTitle>
              <CardDescription>{editingClone ? 'Ajuste os detalhes do seu clone abaixo.' : 'Defina a personalidade e o conhecimento do seu especialista de IA.'}</CardDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20"><AvatarImage src={form.watch('avatar_url') || ''} /><AvatarFallback className="text-3xl">{form.watch('emoji') || '🤖'}</AvatarFallback></Avatar>
                  <div>
                    <Label htmlFor="avatar-upload">Foto do Clone</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Button asChild variant="outline" size="sm"><label htmlFor="avatar-upload" className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />{isUploading ? 'Carregando...' : 'Carregar Imagem'}</label></Button>
                      <Input id="avatar-upload" type="file" className="hidden" onChange={handleAvatarUpload} accept="image/png, image/jpeg" disabled={isUploading} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>Nome do Clone</FormLabel><FormControl><Input placeholder="Ex: Steve Jobs" {...field} /></FormControl><FormDescription>Insira o nome de uma figura pública para gerar a persona.</FormDescription><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="emoji" render={({ field }) => (<FormItem><FormLabel>Emoji (Fallback)</FormLabel><FormControl><Input placeholder="💡" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Cargo / Título</FormLabel><FormControl><Input placeholder="Ex: Co-fundador da Apple" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição Curta</FormLabel><FormControl><Textarea placeholder="Descreva o propósito principal deste clone em uma frase." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="persona" render={({ field }) => (<FormItem><div className="flex items-center justify-between"><FormLabel>Persona / Instruções</FormLabel><Button type="button" variant="outline" size="sm" onClick={handleGeneratePersona} disabled={!form.watch('name') || isGeneratingPersona}>{isGeneratingPersona ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Gerar com IA</Button></div><FormDescription>Digite um nome acima e clique em "Gerar com IA" para criar uma persona automaticamente, ou escreva a sua própria.</FormDescription><FormControl><Textarea placeholder="Descreva o tom de voz, a área de conhecimento, o estilo de resposta e as regras que este clone deve seguir..." rows={10} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editingClone ? 'Salvar Alterações' : 'Criar Clone'}</Button></div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : clones.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clones.map(clone => (
            <Card key={clone.id} className="flex flex-col">
              <CardHeader className="flex-row gap-4 items-start">
                <Avatar className="w-12 h-12 border"><AvatarImage src={clone.avatar_url || ''} /><AvatarFallback className="text-2xl">{clone.emoji || '🤖'}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <CardTitle>{clone.name}</CardTitle>
                  <CardDescription>{clone.title || 'Sem título'}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="-mt-2 -mr-2"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenDialog(clone)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                    <AlertDialog><AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir "{clone.name}"?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. O clone será removido permanentemente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteClone(clone.id)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">{clone.description || 'Nenhuma descrição fornecida.'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              <Inbox className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-semibold text-foreground">Nenhum clone encontrado</h3>
              <p className="mt-1">Clique em "Criar Novo Clone" para começar.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomClones;