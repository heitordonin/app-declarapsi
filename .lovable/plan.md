

## Plano: Adicionar hCaptcha ao Login

### Pre-requisito (Acao do Usuario)

1. Acesse https://www.hcaptcha.com/ e crie uma conta gratuita
2. Apos login, voce recebera:
   - **Site Key** (publica - vai no frontend)
   - **Secret Key** (privada - vai no backend como secret)

---

### Arquitetura da Solucao

```text
+----------------+     +------------------+     +-------------------+
|  Tela de Login | --> | Edge Function    | --> | hCaptcha API      |
|  (hCaptcha)    |     | verify-hcaptcha  |     | (valida token)    |
+----------------+     +------------------+     +-------------------+
       |                       |
       v                       v
  Token CAPTCHA           Resposta OK/Erro
```

**Fluxo:**
1. Usuario preenche email/senha
2. Widget hCaptcha exibe desafio (se necessario)
3. Token gerado e enviado junto com credenciais para Edge Function
4. Edge Function valida token com API do hCaptcha
5. Se valido, autentica o usuario; se nao, bloqueia

---

### Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `supabase/functions/verify-hcaptcha/index.ts` | Criar | Edge Function para validar token |
| `supabase/config.toml` | Modificar | Adicionar configuracao da funcao |
| `src/pages/Auth.tsx` | Modificar | Adicionar widget hCaptcha |
| `src/hooks/useAuth.tsx` | Modificar | Adicionar metodo signInWithCaptcha |
| `package.json` | Modificar | Adicionar `@hcaptcha/react-hcaptcha` |

---

### Detalhes Tecnicos

#### 1. Instalar Dependencia

```bash
npm install @hcaptcha/react-hcaptcha
```

#### 2. Criar Edge Function `verify-hcaptcha`

```typescript
// supabase/functions/verify-hcaptcha/index.ts

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, email, password, isLogin } = await req.json();
    
    // Validar token com hCaptcha
    const hcaptchaResponse = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: Deno.env.get("HCAPTCHA_SECRET_KEY")!,
        response: token,
      }),
    });
    
    const result = await hcaptchaResponse.json();
    
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: "Verificacao CAPTCHA falhou" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // CAPTCHA valido - autenticar usuario via Admin API
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Usar API direta do Supabase Auth
    const authEndpoint = isLogin 
      ? `${supabaseUrl}/auth/v1/token?grant_type=password`
      : `${supabaseUrl}/auth/v1/signup`;
      
    const authResponse = await fetch(authEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ email, password }),
    });
    
    const authData = await authResponse.json();
    
    if (authData.error || authData.error_description) {
      return new Response(
        JSON.stringify({ error: authData.error_description || authData.error || "Erro na autenticacao" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        session: authData,
        message: isLogin ? "Login realizado" : "Cadastro realizado" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

#### 3. Modificar `src/pages/Auth.tsx`

```tsx
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useRef } from 'react';

// Dentro do componente:
const [captchaToken, setCaptchaToken] = useState<string | null>(null);
const captchaRef = useRef<HCaptcha>(null);

// Handler de submit modificado:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!captchaToken) {
    toast.error('Por favor, complete a verificacao de seguranca');
    return;
  }
  
  setLoading(true);

  try {
    if (isLogin) {
      const { error } = await signInWithCaptcha(email, password, captchaToken);
      if (error) throw error;
      toast.success('Login realizado com sucesso!');
    } else {
      // Para cadastro, manter fluxo atual ou adicionar captcha tambem
      const { error } = await signUp(email, password, fullName);
      if (error) throw error;
      toast.success('Cadastro realizado! Verifique seu email.');
    }
  } catch (error: any) {
    toast.error(error.message || 'Erro na autenticacao');
    captchaRef.current?.resetCaptcha();
    setCaptchaToken(null);
  } finally {
    setLoading(false);
  }
};

// No JSX, antes do botao de submit:
<div className="flex justify-center">
  <HCaptcha
    ref={captchaRef}
    sitekey="SUA_SITE_KEY_AQUI"
    onVerify={(token) => setCaptchaToken(token)}
    onExpire={() => setCaptchaToken(null)}
    onError={() => setCaptchaToken(null)}
  />
</div>

// Botao desabilitado sem captcha:
<Button type="submit" className="w-full" disabled={loading || !captchaToken}>
```

#### 4. Modificar `src/hooks/useAuth.tsx`

Adicionar novo metodo que usa a Edge Function:

```tsx
const signInWithCaptcha = async (email: string, password: string, captchaToken: string) => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-hcaptcha`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        token: captchaToken, 
        email, 
        password, 
        isLogin: true 
      }),
    }
  );
  
  const data = await response.json();
  
  if (data.error) {
    return { error: { message: data.error } as AuthError };
  }
  
  // Configurar sessao com os dados retornados
  if (data.session?.access_token) {
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  }
  
  return { error: null };
};

// Adicionar ao return do Provider:
return (
  <AuthContext.Provider value={{ 
    user, session, role, loading, 
    signIn, signUp, signOut, 
    signInWithCaptcha  // Novo metodo
  }}>
    {children}
  </AuthContext.Provider>
);
```

---

### Secret Necessario

| Nome | Descricao |
|------|-----------|
| `HCAPTCHA_SECRET_KEY` | Secret Key do hCaptcha (privada) |

A Site Key e publica e sera adicionada diretamente no codigo frontend.

---

### Resultado Esperado

**Antes:**
- Formulario de login simples
- Vulneravel a ataques automatizados

**Depois:**
- Widget hCaptcha aparece no login
- Bots bloqueados antes de tentar autenticar
- Usuarios legitimos passam rapidamente pelo desafio

---

### Proximos Passos Apos Aprovacao

1. Voce cria conta no hCaptcha e obtem Site Key + Secret Key
2. Eu solicito que voce adicione o secret `HCAPTCHA_SECRET_KEY` via ferramenta
3. Voce me informa a Site Key publica
4. Eu implemento todas as alteracoes no codigo

