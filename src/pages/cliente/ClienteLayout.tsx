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
  MessageSquare
} from 'lucide-react';

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
        .select('name, cpf')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
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
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={handleNavClick}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg mx-2 transition-colors",
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
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
              
              {/* Botão Sair */}
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

        <div className="w-10" /> {/* Espaçador para centralizar o nome */}
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-auto pt-16 pb-6">
        <Outlet />
      </main>
    </div>
  );
}
