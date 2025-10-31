import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admins can access any route
  if (role === 'admin') {
    return <>{children}</>;
  }

  // Clients can only access client routes
  if (role === 'client') {
    if (requiredRole === 'admin') {
      return <Navigate to="/cliente/documentos" replace />;
    }
    return <>{children}</>;
  }

  // Invalid or undefined role - redirect to login
  return <Navigate to="/auth" replace />;
}
