import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LogOut,
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

// Itens do bloco inferior do menu
const bottomMenuItems = [
  { icon: User, label: 'Perfil', path: '/cliente/perfil' },
  { icon: Settings, label: 'Configurações', path: '/cliente/configuracoes' },
  { icon: Gift, label: 'Indique um amigo', path: '/cliente/indique-amigo' },
];

interface ClienteSidebarProps {
  unreadCount?: number;
}

export function ClienteSidebar({ unreadCount = 0 }: ClienteSidebarProps) {
  const { signOut } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      {/* Logo */}
      <SidebarHeader className="border-b p-4">
        <div className={cn(
          "flex items-center justify-center transition-all duration-200",
          isCollapsed ? "px-0" : "px-2"
        )}>
          {isCollapsed ? (
            <span className="text-lg font-bold text-primary">DP</span>
          ) : (
            <h2 className="text-xl font-bold">
              <span className="text-primary">Declara</span>
              <span className="text-accent">Psi</span>
            </h2>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Módulos de Navegação */}
        {sidebarModules.map((module) => (
          <SidebarGroup key={module.id}>
            <SidebarGroupLabel>
              <module.icon className="h-4 w-4 mr-2" />
              {!isCollapsed && module.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {module.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const showUnreadBadge = item.path === '/cliente/comunicados' && unreadCount > 0;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.path} className="relative">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          {showUnreadBadge && (
                            <span className="absolute right-2 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          {/* Itens do menu inferior */}
          {bottomMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link to={item.path}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          
          {/* Botão Sair */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
