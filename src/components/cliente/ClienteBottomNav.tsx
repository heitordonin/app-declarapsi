import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, TrendingUp, FileText, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/cliente/dashboard' },
  { icon: Users, label: 'Pacientes', path: '/cliente/pacientes' },
  { icon: TrendingUp, label: 'Receitas', path: '/cliente/receitas' },
  { icon: FileText, label: 'Documentos', path: '/cliente/documentos' },
];

export function ClienteBottomNav() {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors",
                isActive 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        
        {/* Botão Menu para abrir sidebar completo */}
        <button
          onClick={() => setOpenMobile(true)}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
