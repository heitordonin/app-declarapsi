import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Menu,
  LogOut,
  Loader2,
  ChevronDown,
  Briefcase,
  LayoutDashboard,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calculator,
  CreditCard,
  FileText,
  MessageSquare,
  User,
  Settings,
  Gift
} from 'lucide-react';

// Itens do bloco inferior do menu
const bottomMenuItems = [
  { icon: User, label: 'Perfil', path: '/cliente/perfil' },
  { icon: Settings, label: 'Configurações', path: '/cliente/configuracoes' },
  { icon: Gift, label: 'Indique um amigo', path: '/cliente/indique-amigo' },
];

// Estrutura dos módulos do sidebar
const sidebarModules = [
  {
    id: 'gestao',
    title: 'Gestão',
    icon: Briefcase,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/cliente/dashboard' },
      { icon: Users, label: 'Pacientes', path: '/cliente/pacientes' },
    ]
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    icon: Wallet,
    items: [
      { icon: TrendingUp, label: 'Receitas', path: '/cliente/receitas' },
      { icon: TrendingDown, label: 'Despesas', path: '/cliente/despesas' },
    ]
  },
  {
    id: 'contabilidade',
    title: 'Contabilidade',
    icon: Calculator,
    items: [
      { icon: CreditCard, label: 'Pagamentos', path: '/cliente/pagamentos' },
      { icon: FileText, label: 'Documentos', path: '/cliente/documentos' },
      { icon: MessageSquare, label: 'Comunicados', path: '/cliente/comunicados' },
    ]
  },
];

export default function ClienteLayout() {
  const { signOut } = useAuth();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Determinar qual módulo deve estar aberto baseado na rota atual
  const getOpenModules = () => {
    const openModules: string[] = [];
    sidebarModules.forEach(mod => {
      if (mod.items.some(item => location.pathname === item.path)) {
        openModules.push(mod.id);
      }
    });
    return openModules.length > 0 ? openModules : ['gestao'];
  };
  
  const [openModules, setOpenModules] = useState<string[]>(getOpenModules);

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
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });

  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleNavClick = () => {
    setSheetOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Cabeçalho Fixo */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b z-20 flex items-center justify-between px-4">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-primary">DeclaraPsi</h2>
              </div>
              
              {/* Módulos de Navegação */}
              <div className="flex-1 overflow-auto py-4">
                {sidebarModules.map((module) => (
                  <Collapsible
                    key={module.id}
                    open={openModules.includes(module.id)}
                    onOpenChange={() => toggleModule(module.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <module.icon className="h-5 w-5 text-primary" />
                          <span>{module.title}</span>
                        </div>
                        <ChevronDown className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          openModules.includes(module.id) && "rotate-180"
                        )} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pl-4 pb-2">
                        {module.items.map((item) => {
                          const isActive = location.pathname === item.path;
                          const showUnreadBadge = item.path === '/cliente/comunicados' && unreadCount > 0;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={handleNavClick}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg mx-2 transition-colors relative",
                                isActive 
                                  ? "bg-primary/10 text-primary font-medium" 
                                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                              )}
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.label}</span>
                              {showUnreadBadge && (
                                <span className="absolute right-3 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
              
              {/* Menu inferior: Perfil, Configurações, Indique e Sair */}
              <div className="p-3 border-t space-y-1">
                {bottomMenuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={handleNavClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors w-full",
                        isActive 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <Button variant="outline" className="w-full justify-start mt-2" onClick={() => signOut()}>
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

        <div className="w-10" /> {/* Espaçador para centralizar o nome */}
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-auto pt-16 pb-6">
        <Outlet />
      </main>
    </div>
  );
}
