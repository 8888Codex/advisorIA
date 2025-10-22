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
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const profileSchema = z.object({
  first_name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  last_name: z.string().min(2, { message: 'O sobrenome deve ter pelo menos 2 caracteres.' }),
});

const Settings = () => {
  const { session, supabase } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', session.user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116: single row not found
          throw error;
        }

        if (data) {
          form.reset({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
          });
        }
      } catch (error) {
        showError('Falha ao carregar seu perfil.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [session, supabase, form]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!session?.user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          updated_at: new Date().toISOString(),
        })
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
          <CardDescription>Atualize seu nome e sobrenome.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-24" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sobrenome</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu sobrenome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;