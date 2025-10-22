import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Upload, ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  first_name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  last_name: z.string().min(2, { message: 'O sobrenome deve ter pelo menos 2 caracteres.' }),
});

const passwordSchema = z.object({
  password: z.string().min(6, { message: 'A nova senha deve ter pelo menos 6 caracteres.' }),
});

const Settings = () => {
  const { session, supabase } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { first_name: '', last_name: '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', session.user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          profileForm.reset({ first_name: data.first_name || '', last_name: data.last_name || '' });
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        showError('Falha ao carregar seu perfil.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [session, supabase, profileForm]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !session?.user) return;
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${session.user.id}-${Math.random()}.${fileExt}`;

    setIsUploading(true);
    try {
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);
      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      showSuccess('Avatar atualizado com sucesso!');
    } catch (error) {
      showError('Falha ao carregar o avatar.');
    } finally {
      setIsUploading(false);
    }
  };

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!session?.user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ first_name: values.first_name, last_name: values.last_name, updated_at: new Date().toISOString() })
        .eq('id', session.user.id);

      if (error) throw error;
      showSuccess('Perfil atualizado com sucesso!');
    } catch (error) {
      showError('Falha ao atualizar o perfil.');
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      showSuccess('Senha atualizada com sucesso!');
      passwordForm.reset();
    } catch (error) {
      showError('Falha ao atualizar a senha.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;
      showSuccess('Sua conta foi excluída com sucesso.');
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      showError('Falha ao excluir a conta.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as informações da sua conta e perfil.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Atualize suas informações pessoais e avatar.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20"><AvatarImage src={avatarUrl || ''} /><AvatarFallback className="text-3xl">{profileForm.getValues('first_name')?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="text-sm font-medium">Foto de Perfil</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button asChild variant="outline" size="sm"><label htmlFor="avatar-upload" className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />{isUploading ? 'Carregando...' : 'Carregar Imagem'}</label></Button>
                    <Input id="avatar-upload" type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" disabled={isUploading} />
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF até 2MB.</p>
                  </div>
                </div>
              </div>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={profileForm.control} name="first_name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Seu nome" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={profileForm.control} name="last_name" render={({ field }) => (<FormItem><FormLabel>Sobrenome</FormLabel><FormControl><Input placeholder="Seu sobrenome" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>{profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar Alterações</Button>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento da Conta</CardTitle>
          <CardDescription>Altere sua senha ou exclua sua conta permanentemente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-sm">
              <FormField control={passwordForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Nova Senha</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={passwordForm.formState.isSubmitting}>{passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Alterar Senha</Button>
            </form>
          </Form>
          <Separator />
          <div>
            <h3 className="text-md font-semibold">Excluir Conta</h3>
            <p className="text-sm text-muted-foreground mt-1">Esta ação é irreversível. Todos os seus dados, incluindo clones e conversas, serão permanentemente removidos.</p>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" className="mt-4"><ShieldAlert className="mr-2 h-4 w-4" />Excluir Minha Conta</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá seus dados de nossos servidores.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteAccount}>Sim, excluir minha conta</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;