import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ContadorLayout from "./pages/contador/ContadorLayout";
import Obrigacoes from "./pages/contador/Obrigacoes";
import Relatorios from "./pages/contador/Relatorios";
import Conferencia from "./pages/contador/Conferencia";
import Protocolos from "./pages/contador/Protocolos";
import Configuracoes from "./pages/contador/Configuracoes";
import Comunicados from "./pages/contador/Comunicados";
import Clientes from "./pages/contador/Clientes";
import ClienteLayout from "./pages/cliente/ClienteLayout";
import Index from "./pages/cliente/Index";
import Dashboard from "./pages/cliente/Dashboard";
import Pacientes from "./pages/cliente/Pacientes";
import Receitas from "./pages/cliente/Receitas";
import Despesas from "./pages/cliente/Despesas";
import Pagamentos from "./pages/cliente/Pagamentos";
import Documentos from "./pages/cliente/Documentos";
import ClienteComunicados from "./pages/cliente/Comunicados";
import Perfil from "./pages/cliente/Perfil";
import ClienteConfiguracoes from "./pages/cliente/Configuracoes";
import IndiqueAmigo from "./pages/cliente/IndiqueAmigo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function RootRedirect() {
  const { user, role, loading } = useAuth();

  if (loading) return null;
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role === 'admin') {
    return <Navigate to="/contador/obrigacoes" replace />;
  } else if (role === 'client') {
    return <Navigate to="/cliente" replace />;
  }

  return <Navigate to="/auth" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
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
              <Route index element={<Index />} />
              {/* Gestão */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="pacientes" element={<Pacientes />} />
              {/* Financeiro */}
              <Route path="receitas" element={<Receitas />} />
              <Route path="despesas" element={<Despesas />} />
              {/* Contabilidade */}
              <Route path="pagamentos" element={<Pagamentos />} />
              <Route path="documentos" element={<Documentos />} />
              <Route path="comunicados" element={<ClienteComunicados />} />
              {/* Conta */}
              <Route path="perfil" element={<Perfil />} />
              <Route path="configuracoes" element={<ClienteConfiguracoes />} />
              <Route path="indique-amigo" element={<IndiqueAmigo />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
