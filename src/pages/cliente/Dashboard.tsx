import { LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <LayoutDashboard className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Dashboard</h1>
      <p className="text-muted-foreground text-center">
        Esta página está sendo desenvolvida.
      </p>
    </div>
  );
}
