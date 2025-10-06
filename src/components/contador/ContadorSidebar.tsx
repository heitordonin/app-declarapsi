import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CalendarDays, Mail, Users, LogOut, FileText, BarChart, Settings, PieChart } from 'lucide-react';
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
import logo from '@/assets/logo-declara-psi.png';

const navItems = [
  { icon: CalendarDays, label: 'Obrigações', path: '/contador/obrigacoes' },
  { icon: PieChart, label: 'Relatórios', path: '/contador/relatorios' },
  { icon: FileText, label: 'Conferência', path: '/contador/conferencia' },
  { icon: BarChart, label: 'Protocolos', path: '/contador/protocolos' },
  { icon: Settings, label: 'Configurações', path: '/contador/configuracoes' },
  { icon: Mail, label: 'Comunicados', path: '/contador/comunicados' },
  { icon: Users, label: 'Clientes', path: '/contador/clientes' },
];

export function ContadorSidebar() {
  const { signOut } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <img 
          src={logo} 
          alt="Declara Psi" 
          className={`h-auto transition-all duration-200 ${isCollapsed ? 'w-full' : 'w-4/5 mx-auto'}`}
        />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Área do Contador</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.path}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
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
