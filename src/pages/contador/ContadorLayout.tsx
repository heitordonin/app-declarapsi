import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CalendarDays, Mail, Users, LogOut, FileText, BarChart, Settings } from 'lucide-react';

export default function ContadorLayout() {
  const { signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: CalendarDays, label: 'Obrigações', path: '/contador/obrigacoes' },
    { icon: FileText, label: 'Conferência', path: '/contador/conferencia' },
    { icon: BarChart, label: 'Protocolos', path: '/contador/protocolos' },
    { icon: Settings, label: 'Configurações', path: '/contador/configuracoes' },
    { icon: Mail, label: 'Comunicados', path: '/contador/comunicados' },
    { icon: Users, label: 'Clientes', path: '/contador/clientes' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card">
        <div className="p-6">
          <h1 className="text-xl font-bold text-foreground">Área do Contador</h1>
        </div>
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
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
        <div className="absolute bottom-4 left-3 right-3">
          <Button variant="outline" className="w-full justify-start" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
