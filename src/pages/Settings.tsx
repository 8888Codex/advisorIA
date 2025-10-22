import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';

const profileSchema = z.object({
  first_name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  last_name: z.string().min(2, { message: 'O sobrenome deve ter pelo menos 2 caracteres.' }),
});

const Settings = () => {
  const { session, supabase } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { first_name: '', last_name: '' },
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
          form.reset({ first_name: data.first_name || '', last_name: data.last_name || '' });
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        showError('Falha ao carregar seu perfil.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [session, supabase, form]);

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

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
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

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-1">Configurações</h1>
      <p className="text-muted-foreground mb-8">Gerencie as informações da sua conta.</p>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Atualize suas informações pessoais e avatar.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-24" />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl || ''} />
                  <AvatarFallback className="text-3xl">
                    {form.getValues('first_name')?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="avatar-upload" className="text-sm font-medium">Foto de Perfil</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button asChild variant="outline" size="sm">
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        {isUploading ? 'Carregando...' : 'Carregar Imagem'}
                      </label>
                    </Button>
                    <Input id="avatar-upload" type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" disabled={isUploading} />
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF até 2MB.</p>
                  </div>
                </div>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="first_name" render={({ field }) => (
                      <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Seu nome" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="last_name" render={({ field }) => (
                      <FormItem><FormLabel>Sobrenome</FormLabel><FormControl><Input placeholder="Seu sobrenome" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;