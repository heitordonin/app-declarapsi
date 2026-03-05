

# Correção: Links Quebrados nos Emails de Notificação

## Problema

Ambas as Edge Functions (`send-document-notification` e `send-due-reminders`) geram a URL do app assim:

```javascript
const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || '';
```

Isso produz uma URL incorreta (baseada no ID do projeto Supabase), enquanto a URL real publicada é `https://app-declarapsi.lovable.app`.

Além disso, o link aponta diretamente para `/cliente/documentos`, mas o usuário precisa estar logado primeiro. A correção deve apontar para a página de login (`/auth`), que já redireciona automaticamente para a área do cliente após autenticação.

## Solução

1. Criar um secret `APP_URL` com o valor `https://app-declarapsi.lovable.app`
2. Alterar ambas as funções para usar `Deno.env.get('APP_URL')` e apontar para `/auth` ao invés de `/cliente/documentos`

## Alterações

### Secret a criar
- `APP_URL` = `https://app-declarapsi.lovable.app`

### Arquivo: `supabase/functions/send-document-notification/index.ts`
- Linha 69-70: Substituir a lógica de URL por:
  ```typescript
  const appUrl = Deno.env.get('APP_URL') || 'https://app-declarapsi.lovable.app';
  const clientAreaLink = `${appUrl}/auth`;
  ```
- Linha 95-97: Atualizar o texto do botão para "Acessar Declara Psi"

### Arquivo: `supabase/functions/send-due-reminders/index.ts`
- Linha 83-84: Mesma substituição de URL
- Linha 112: Atualizar o texto do botão para "Acessar Declara Psi"

