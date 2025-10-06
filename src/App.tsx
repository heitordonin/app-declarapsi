import { useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import ContadorLayout from "./pages/contador/ContadorLayout";
import Obrigacoes from "./pages/contador/Obrigacoes";
import Relatorios from "./pages/contador/Relatorios";
import Conferencia from "./pages/contador/Conferencia";
import Protocolos from "./pages/contador/Protocolos";
import Configuracoes from "./pages/contador/Configuracoes";
import Comunicados from "./pages/contador/Comunicados";
import Clientes from "./pages/contador/Clientes";
import ClienteLayout from "./pages/cliente/ClienteLayout";
import Documentos from "./pages/cliente/Documentos";
import ComunicadosCliente from "./pages/cliente/ComunicadosCliente";
import Perfil from "./pages/cliente/Perfil";
import NotFound from "./pages/NotFound";

function RootRedirect() {
  const { user, role, loading } = useAuth();

  if (loading) return null;
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role === 'admin') {
    return <Navigate to="/contador/obrigacoes" replace />;
  } else if (role === 'client') {
    return <Navigate to="/cliente/documentos" replace />;
  }

  return <Navigate to="/auth" replace />;
}

const App = () => {
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  }), []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Contador Routes */}
            <Route path="/contador" element={
              <ProtectedRoute requiredRole="admin">
                <ContadorLayout />
              </ProtectedRoute>
            }>
              <Route path="obrigacoes" element={<Obrigacoes />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="conferencia" element={<Conferencia />} />
              <Route path="protocolos" element={<Protocolos />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="comunicados" element={<Comunicados />} />
              <Route path="clientes" element={<Clientes />} />
            </Route>

            {/* Cliente Routes */}
            <Route path="/cliente" element={
              <ProtectedRoute requiredRole="client">
                <ClienteLayout />
              </ProtectedRoute>
            }>
              <Route path="documentos" element={<Documentos />} />
              <Route path="comunicados" element={<ComunicadosCliente />} />
              <Route path="perfil" element={<Perfil />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
