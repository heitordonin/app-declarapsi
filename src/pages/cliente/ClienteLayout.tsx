import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  Menu,
  LogOut,
  FileText,
  Mail,
  User,
  Home,
  BarChart,
  CreditCard,
  LayoutGrid,
  Loader2
} from 'lucide-react';

// Componente para item da navegação inferior
interface BottomNavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

function BottomNavItem({ to, icon: Icon, label }: BottomNavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium transition-colors",
        isActive ? "text-primary" : "text-muted-foreground hover:text-primary/80"
      )}
    >
      <Icon className="h-5 w-5 mb-0.5" />
      <span>{label}</span>
    </Link>
  );
}

// Links da navegação principal (inferior)
const bottomNavItems = [
  { icon: Home, label: 'Início', path: '/cliente/inicio' },
  { icon: BarChart, label: 'Controle', path: '/cliente/controle' },
  { icon: CreditCard, label: 'Pagar', path: '/cliente/pagar' },
  { icon: LayoutGrid, label: 'Outros', path: '/cliente/outros' },
];

// Links do menu lateral (Sheet)
const sidebarNavItems = [
  { icon: FileText, label: 'Meus Documentos', path: '/cliente/documentos' },
  { icon: Mail, label: 'Comunicados', path: '/cliente/comunicados' },
  { icon: User, label: 'Meu Perfil', path: '/cliente/perfil' },
];

export default function ClienteLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  // Buscar dados do cliente (para CPF)
  const { data: client, isLoading } = useQuery({
    queryKey: ['client-data', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('name, cpf')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Cabeçalho Fixo */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b z-20 flex items-center justify-between px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-foreground">DeclaraPsi</h2>
              </div>
              <nav className="flex-1 space-y-1 p-3">
                {sidebarNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-3 border-t">
                <Button variant="outline" className="w-full justify-start" onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="text-center">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <div className="text-sm font-semibold">{client?.name || 'Cliente'}</div>
              <div className="text-xs text-muted-foreground">{client?.cpf ? formatCpf(client.cpf) : '...'}</div>
            </>
          )}
        </div>

        <div className="w-10"></div> {/* Espaçador para centralizar o nome */}
      </header>

      {/* Conteúdo Principal (com padding para não ficar sob o header/footer) */}
      <main className="flex-1 overflow-auto pt-16 pb-20">
        <Outlet />
      </main>

      {/* Navegação Inferior Fixa */}
      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t z-20">
        <nav className="flex h-full">
          {bottomNavItems.map((item) => (
            <BottomNavItem
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>
      </footer>
    </div>
  );
}
