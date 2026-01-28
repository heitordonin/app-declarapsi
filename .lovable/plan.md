
# Plano de Correcao de Gargalos de Performance

## Resumo Executivo

Este plano centraliza a busca do `client_id` em um unico hook com cache do TanStack Query, eliminando multiplas requisicoes redundantes ao banco de dados. Atualmente, cada hook do modulo cliente faz sua propria busca do `client_id`, gerando requisicoes duplicadas quando o usuario navega entre paginas.

---

## Problema Identificado

### Analise das Requisicoes Redundantes

Cada hook possui sua propria funcao para buscar o `client_id`:

| Arquivo | Funcao | Chamadas por Hook |
|---------|--------|-------------------|
| `useChargesData.ts` | `fetchClientId()` | 6x (query + 5 mutations) |
| `useExpensesData.ts` | `getClientId()` | 2x (query + create) |
| `useDashboardData.ts` | `fetchClientId()` | 2x (uma por query) |
| `useCommunicationsData.ts` | inline | 1x |
| `useClientProfile.ts` | inline | 2x (query + update) |

### Impacto

Quando o usuario acessa a pagina de Dashboard (que usa `useDashboardData`), sao feitas **2 requisicoes** separadas para buscar o mesmo `client_id`. Se o usuario navegar para Receitas, mais **6 chamadas potenciais** ao `fetchClientId()`.

### Padrao Existente Positivo

O `useDocumentsData.ts` ja implementa o padrao correto:

```typescript
const { data: clientData } = useQuery({
  queryKey: ['client-id', user?.id],
  queryFn: async () => {...},
  enabled: !!user,
});
```

Este padrao usa o cache do TanStack Query, evitando requisicoes duplicadas.

---

## Solucao Proposta

### Passo 1: Criar Hook Centralizado `useClientId.ts`

Criar um novo arquivo `src/hooks/cliente/useClientId.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useClientId() {
  const { user } = useAuth();

  const { data: clientId, isLoading, error } = useQuery({
    queryKey: ['client-id', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      return data.id;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 minutos - client_id nao muda
    gcTime: 1000 * 60 * 60,    // 1 hora no cache
  });

  return {
    clientId,
    isLoading,
    error,
  };
}
```

### Passo 2: Atualizar `useChargesData.ts`

Remover funcao `fetchClientId()` duplicada e usar hook centralizado:

```typescript
import { useClientId } from './useClientId';

export function useChargesData() {
  const queryClient = useQueryClient();
  const { clientId } = useClientId();

  const { data: charges = [], isLoading, error } = useQuery({
    queryKey: ['charges', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('charges')
        .select(`...`)
        .eq('client_id', clientId)
        .order('due_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  // Mutations agora usam clientId do hook
  const createMutation = useMutation({
    mutationFn: async (data: ChargeFormData) => {
      if (!clientId) throw new Error('Cliente nao encontrado');
      return createChargeInDb({ clientId, data });
    },
    // ...
  });
  // ...
}
```

### Passo 3: Atualizar `useExpensesData.ts`

Remover funcao `getClientId()` e usar hook centralizado:

```typescript
import { useClientId } from './useClientId';

export function useExpensesData() {
  const queryClient = useQueryClient();
  const { clientId } = useClientId();

  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ['expenses', clientId],
    queryFn: async (): Promise<Expense[]> => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select(`...`)
        .eq('client_id', clientId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
  // ...
}
```

### Passo 4: Atualizar `useDashboardData.ts`

Refatorar para usar hook centralizado:

```typescript
import { useClientId } from './useClientId';

export function useDashboardData(startDate: Date, endDate: Date): DashboardData {
  const { clientId } = useClientId();
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data: chargesData, isLoading: chargesLoading } = useQuery({
    queryKey: ['dashboard-charges', clientId, startDateStr, endDateStr],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('charges')
        .select('amount, sessions_count')
        .eq('client_id', clientId)
        .eq('status', 'paid')
        .gte('payment_date', startDateStr)
        .lte('payment_date', endDateStr);

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
  // ... mesmo padrao para expensesData
}
```

### Passo 5: Atualizar `useCommunicationsData.ts`

Refatorar para usar hook centralizado:

```typescript
import { useClientId } from './useClientId';

export function useCommunicationsData() {
  const queryClient = useQueryClient();
  const { clientId } = useClientId();

  const { data: communications = [], isLoading, error } = useQuery({
    queryKey: ['client-communications', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('communication_recipients')
        .select(`...`)
        .eq('client_id', clientId)
        .order('sent_at', { foreignTable: 'communications', ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
  // ...
}
```

### Passo 6: Atualizar `useDocumentsData.ts`

Remover query duplicada de `client-id` e usar hook centralizado:

```typescript
import { useClientId } from './useClientId';

export function useDocumentsData() {
  const queryClient = useQueryClient();
  const { clientId } = useClientId();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['permanent-documents', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('permanent_documents')
        .select('id, name, file_path, file_name, uploaded_at, viewed_at')
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
    enabled: !!clientId,
  });
  // ...
}
```

### Passo 7: Atualizar `usePaymentsData.ts`

Este hook ja recebe `clientId` como prop. Vamos mante-lo assim mas garantir que a pagina `Pagamentos.tsx` use o `useClientId`:

```typescript
// Em Pagamentos.tsx
import { useClientId } from '@/hooks/cliente/useClientId';

export default function Pagamentos() {
  const { clientId } = useClientId();
  const { payments, isLoading, ... } = usePaymentsData(clientId);
  // ...
}
```

---

## Resumo de Alteracoes por Arquivo

| Arquivo | Acao |
|---------|------|
| `src/hooks/cliente/useClientId.ts` | **CRIAR** - Hook centralizado |
| `src/hooks/cliente/useChargesData.ts` | Remover `fetchClientId()`, usar `useClientId()` |
| `src/hooks/cliente/useExpensesData.ts` | Remover `getClientId()`, usar `useClientId()` |
| `src/hooks/cliente/useDashboardData.ts` | Remover `fetchClientId()`, usar `useClientId()` |
| `src/hooks/cliente/useCommunicationsData.ts` | Remover busca inline, usar `useClientId()` |
| `src/hooks/cliente/useDocumentsData.ts` | Remover query `client-id`, usar `useClientId()` |
| `src/pages/cliente/Pagamentos.tsx` | Importar e usar `useClientId()` |

---

## Beneficios da Solucao

1. **Reducao de Requisicoes**: De ~15 chamadas potenciais para 1 chamada cacheada
2. **Cache Inteligente**: TanStack Query gerencia cache automaticamente
3. **staleTime de 30min**: `client_id` nao muda durante sessao
4. **Codigo DRY**: Logica centralizada, facil manutencao
5. **Consistencia**: Todas as queries dependem do mesmo `clientId`

---

## Fluxo de Dados Apos Implementacao

```text
Usuario faz login
       |
       v
useAuth fornece user.id
       |
       v
useClientId busca client_id UMA VEZ
       |
       v
TanStack Query cacheia por 30 minutos
       |
       v
Todos os hooks consomem do cache
```

---

## Testes Recomendados

1. Fazer login e navegar entre todas as paginas do modulo cliente
2. Verificar no DevTools > Network que `client_id` e buscado apenas uma vez
3. Verificar que dados carregam corretamente em todas as paginas
4. Testar criacao/edicao de receitas e despesas
5. Verificar que mutations funcionam corretamente com clientId cacheado

---

## Impacto Esperado

- **Reducao de latencia**: Menos round-trips ao banco
- **Menor carga no servidor**: Menos queries redundantes
- **UX mais fluida**: Navegacao mais rapida entre paginas
- **Codigo mais limpo**: Remocao de funcoes duplicadas
