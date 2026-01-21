import { LayoutDashboard, Users, TrendingUp, FileText, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

const miniNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/cliente/dashboard' },
  { icon: Users, label: 'Pacientes', path: '/cliente/pacientes' },
  { icon: TrendingUp, label: 'Receitas', path: '/cliente/receitas' },
  { icon: FileText, label: 'Documentos', path: '/cliente/documentos' },
];

export function ClienteMiniSidebar() {
  const { setOpenMobile, openMobile } = useSidebar();

  // Não mostrar se o sheet estiver aberto
  if (openMobile) return null;

  return (
    <div className="fixed left-0 top-0 bottom-0 z-40 w-14 bg-sidebar border-r flex flex-col items-center py-4 gap-2 md:hidden">
      {/* Logo DP */}
      <div className="mb-4">
        <span className="text-lg font-bold text-primary">DP</span>
      </div>
      
      {/* Ícones dos módulos */}
      {miniNavItems.map((item) => (
        <button
          key={item.path}
          onClick={() => setOpenMobile(true)}
          className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-sidebar-accent transition-colors"
          title={item.label}
        >
          <item.icon className="h-5 w-5 text-sidebar-foreground" />
        </button>
      ))}
      
      {/* Separador */}
      <div className="flex-1" />
      
      {/* Botão Menu */}
      <button
        onClick={() => setOpenMobile(true)}
        className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-sidebar-accent transition-colors"
        title="Menu completo"
      >
        <Menu className="h-5 w-5 text-sidebar-foreground" />
      </button>
    </div>
  );
}
