# hCaptcha - Implementado ✓

## Resumo

hCaptcha foi integrado ao login para proteção contra bots.

## Configuração

- **Site Key (pública)**: `c3467a54-24f4-42b0-bfde-b6bc9beec2a4` - no código frontend
- **Secret Key (privada)**: `HCAPTCHA_SECRET_KEY` - configurada nos secrets

## Arquivos Criados/Modificados

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/verify-hcaptcha/index.ts` | Edge Function para validar CAPTCHA |
| `src/pages/Auth.tsx` | Widget hCaptcha no formulário |
| `src/hooks/useAuth.tsx` | Método `signInWithCaptcha` |
| `supabase/config.toml` | Configuração da função |

## Fluxo

1. Usuário preenche email/senha
2. Completa desafio hCaptcha
3. Token enviado para Edge Function
4. Função valida com API hCaptcha
5. Se válido, autentica e retorna sessão
