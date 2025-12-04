import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecoveryType, setIsRecoveryType] = useState(false);
  const [hasCheckedRecovery, setHasCheckedRecovery] = useState(false);

  // Fase 1: Verificar se é recovery (executa apenas uma vez)
  useEffect(() => {
    const checkRecoveryType = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      const errorDescription = params.get('error_description');
      
      // Verificar se há erro no callback
      if (error) {
        console.error('Auth callback error:', error, errorDescription);
        toast({
          variant: 'destructive',
          title: 'Link inválido ou expirado',
          description: 'Por favor, solicite um novo link de cadastro.',
        });
        setTimeout(() => navigate('/auth', { replace: true }), 3000);
        return;
      }
      
      const type = params.get('type');
      const isRecovery = hash.includes('type=recovery') || type === 'recovery';
      
      console.log('Checking recovery type:', { hash, type, isRecovery });
      
      setIsRecoveryType(isRecovery);
      setHasCheckedRecovery(true);
    };
    
    checkRecoveryType();
  }, [navigate]);

  // Fase 2: Redirecionar se NÃO for recovery (só após verificar)
  useEffect(() => {
    if (!hasCheckedRecovery) return;
    if (isRecoveryType) return;
    if (!role) return;

    if (role === 'admin') {
      navigate('/contador/obrigacoes', { replace: true });
    } else if (role === 'client') {
      navigate('/cliente', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [hasCheckedRecovery, isRecoveryType, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Senha inválida',
        description: 'A senha deve ter no mínimo 8 caracteres.',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Senhas não coincidem',
        description: 'Por favor, verifique se as senhas digitadas são iguais.',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: 'Senha definida com sucesso!',
        description: 'Você será redirecionado para o sistema.',
      });

      // Redirecionar após definir senha
      setTimeout(() => {
        if (role === 'admin') {
          navigate('/contador/obrigacoes', { replace: true });
        } else if (role === 'client') {
          navigate('/cliente', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }, 1500);
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao definir senha',
        description: error.message || 'Ocorreu um erro ao definir sua senha. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isRecoveryType) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Defina sua senha</CardTitle>
          <CardDescription>
            Crie uma senha segura para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Definindo senha...' : 'Definir senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
