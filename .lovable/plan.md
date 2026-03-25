

# Fix: Rota `/` redirecionando para `/auth` indevidamente

## Problema

No `RootRedirect`, quando o usuário está logado mas **não tem role** no banco (ou a busca de role falha), o código cai no fallback da linha 61 que redireciona para `/auth`. Isso pode acontecer com sessões expiradas ou usuários sem role atribuída.

```text
user = truthy (sessão existe)
role = null   (fetch falhou ou não existe)
loading = false
→ Navigate to /auth  ← BUG
```

## Solução

Duas correções no `src/App.tsx`:

1. **`RootRedirect`**: Se o usuário está logado mas não tem role, mostrar a LandingPage (ou fazer signOut) em vez de redirecionar para `/auth`
2. Garantir que o fallback final nunca redirecione para `/auth` silenciosamente

**Mudança no código:**

```tsx
function RootRedirect() {
  const { user, role, loading, signOut } = useAuth();

  if (loading) return null;
  
  if (!user) {
    return <LandingPage />;
  }

  if (role === 'admin') {
    return <Navigate to="/contador/obrigacoes" replace />;
  } else if (role === 'client') {
    return <Navigate to="/cliente" replace />;
  }

  // Usuário logado sem role válida — deslogar e mostrar landing
  signOut();
  return <LandingPage />;
}
```

**Arquivo:** `src/App.tsx` — apenas a função `RootRedirect` (linhas 46-62)

