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

  useEffect(() => {
    // Parse hash para verificar se é um link de recovery
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecoveryType(true);
    } else {
      // Se não for recovery, redirecionar baseado no role
      if (role === 'admin') {
        navigate('/contador/obrigacoes', { replace: true });
      } else if (role === 'client') {
        navigate('/cliente/documentos', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [role, navigate]);

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
          navigate('/cliente/documentos', { replace: true });
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
