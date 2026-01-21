import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ClienteSidebar } from '@/components/cliente/ClienteSidebar';
import { ClienteMiniSidebar } from '@/components/cliente/ClienteMiniSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function ClienteLayout() {
  // Buscar dados do cliente
  const { data: client, isLoading } = useQuery({
    queryKey: ['client-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('name, cpf, id')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Buscar contagem de comunicados não lidos
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-communications-count'],
    queryFn: async () => {
      if (!client?.id) return 0;

      const { count, error } = await supabase
        .from('communication_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .is('viewed_at', null);

      if (error) return 0;
      return count || 0;
    },
    enabled: !!client?.id,
    refetchInterval: 60000,
  });

  // Buscar contagem de documentos novos (não visualizados)
  const { data: newDocumentsCount = 0 } = useQuery({
    queryKey: ['new-documents-count'],
    queryFn: async () => {
      if (!client?.id) return 0;

      const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('delivery_state', 'sent')
        .is('deleted_at', null);

      if (error) return 0;
      return count || 0;
    },
    enabled: !!client?.id,
    refetchInterval: 60000,
  });

  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Mini Sidebar fixo para mobile */}
        <ClienteMiniSidebar />
        
        <ClienteSidebar unreadCount={unreadCount} newDocumentsCount={newDocumentsCount} />
        
        <main className="flex-1 overflow-auto pl-14 md:pl-0">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4">
              <SidebarTrigger className="hidden md:flex" />
              
              {/* Info do cliente no centro */}
              <div className="text-center">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <div className="text-sm font-semibold">{client?.name || 'Cliente'}</div>
                    <div className="text-xs text-muted-foreground">
                      {client?.cpf ? formatCpf(client.cpf) : '...'}
                    </div>
                  </>
                )}
              </div>
              
              <div className="w-10" /> {/* Espaçador para centralizar */}
            </div>
          </header>
          
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
