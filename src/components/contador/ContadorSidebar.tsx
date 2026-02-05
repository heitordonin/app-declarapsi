import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  CalendarDays, 
  Mail, 
  Users, 
  LogOut, 
  FileText, 
  BarChart, 
  Settings, 
  PieChart, 
  FolderOpen, 
  MailCheck,
  ClipboardList,
  Handshake,
  Cog,
  Send
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

// Estrutura dos módulos do sidebar
const sidebarModules = [
  {
    id: 'obrigacoes',
    title: 'Obrigações',
    icon: ClipboardList,
    items: [
      { icon: BarChart, label: 'Gestão', path: '/contador/gestao' },
      { icon: CalendarDays, label: 'Calendário', path: '/contador/obrigacoes' },
      { icon: PieChart, label: 'Relatórios', path: '/contador/relatorios' },
      { icon: FileText, label: 'Conferência', path: '/contador/conferencia' },
      { icon: Send, label: 'Protocolos', path: '/contador/protocolos' },
    ]
  },
  {
    id: 'relacionamento',
    title: 'Relacionamento',
    icon: Handshake,
    items: [
      { icon: FolderOpen, label: 'Documentos', path: '/contador/documentos' },
      { icon: Mail, label: 'Comunicados', path: '/contador/comunicados' },
    ]
  },
  {
    id: 'configuracoes',
    title: 'Configurações',
    icon: Cog,
    items: [
      { icon: Settings, label: 'Configurações', path: '/contador/configuracoes' },
      { icon: MailCheck, label: 'E-mails', path: '/contador/emails' },
      { icon: Users, label: 'Clientes', path: '/contador/clientes' },
    ]
  },
];

export function ContadorSidebar() {
  const { signOut } = useAuth();
  const location = useLocation();
  const { state, setOpenMobile, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
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
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.path} onClick={handleNavClick}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => { handleNavClick(); signOut(); }}>
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
