

# Auditoria Completa: Bugs de Timezone em Datas

## Contexto

O bug clássico: `new Date("2024-03-10")` = UTC meia-noite = `09/03 21:00 BRT` = **D-1**.

Existem dois padrões seguros já usados no sistema:
- **`parseISO(dateStr)`** do date-fns — seguro, interpreta como local
- **`new Date(dateStr + 'T00:00:00')`** — seguro, força local

O problema ocorre com **`new Date(dateStr)`** onde `dateStr` é `"YYYY-MM-DD"` (sem horário).

---

## Vulnerabilidades Encontradas

### CRÍTICAS — Afetam exibição de datas para o usuário

| # | Arquivo | Linha | Código problemático | Impacto |
|---|---------|-------|-------------------|---------|
| 1 | `src/pages/cliente/Receitas.tsx` | 47-48 | `new Date(charge.due_date)` | Filtro de receitas por data — compara datas D-1 |
| 2 | `src/pages/cliente/Receitas.tsx` | 53-54 | `new Date(charge.due_date)` | Mesmo filtro, range final |
| 3 | `src/pages/cliente/Despesas.tsx` | 44-45 | `new Date(expense.paymentDate)` | Filtro de despesas por data — compara D-1 |
| 4 | `src/pages/cliente/Despesas.tsx` | 49-50 | `new Date(expense.paymentDate)` | Mesmo filtro, range final |
| 5 | `src/components/obrigacoes/ObrigacaoGroupedCard.tsx` | 52 | `new Date(internal_target_at)` | Exibe prazo da obrigação como D-1 |
| 6 | `src/components/obrigacoes/ObrigacoesInstancesList.tsx` | 190 | `new Date(dateKey)` | Header de data no agrupamento — D-1 |
| 7 | `src/components/obrigacoes/ObrigacaoInstanceCard.tsx` | 50 | `new Date(instance.internal_target_at)` | Cálculo de atraso usa D-1, pode marcar como atrasado indevidamente |
| 8 | `src/lib/obligation-status-utils.ts` | 84 | `new Date(internalTargetAt)` | Cálculo de status efetivo (overdue/due_48h) com data D-1 |
| 9 | `src/hooks/cliente/useDashboardData.ts` | 18-19 | `startDate.toISOString().split('T')[0]` | Pode gerar data D-1 na query do dashboard |

### SEGURAS — Já usam `parseISO()` ou `+ 'T00:00:00'`

- `ChargeCard.tsx` → `parseISO(charge.due_date)` ✅
- `ChargesTable.tsx` → `parseISO(dateStr)` ✅
- `ExpenseCard.tsx` → `parseISO(expense.paymentDate)` ✅
- `ExpensesTable.tsx` → `parseISO(dateStr)` ✅
- `InstancesTable.tsx` → `parseISO(instance.internal_target_at)` ✅
- `PaymentCard.tsx` → `+ 'T00:00:00'` ✅
- `usePaymentsData.ts` → `+ 'T00:00:00'` ✅

### SEGURAS — Timestamps com horário (não afetadas)

Datas como `created_at`, `sent_at`, `viewed_at`, `delivered_at` são `timestamp with time zone` e já incluem informação de timezone. Não são afetadas.

---

## Correções Propostas

### 1. `src/pages/cliente/Receitas.tsx` (linhas 47-54)
Adicionar `+ 'T00:00:00'` nos 4 `new Date()` do filtro de datas.

### 2. `src/pages/cliente/Despesas.tsx` (linhas 44-51)
Adicionar `+ 'T00:00:00'` nos 4 `new Date()` do filtro de datas.

### 3. `src/components/obrigacoes/ObrigacaoGroupedCard.tsx` (linha 52)
Trocar `new Date(internal_target_at)` por `new Date(internal_target_at + 'T00:00:00')`.

### 4. `src/components/obrigacoes/ObrigacoesInstancesList.tsx` (linha 190)
Trocar `new Date(dateKey)` por `new Date(dateKey + 'T00:00:00')`.

### 5. `src/components/obrigacoes/ObrigacaoInstanceCard.tsx` (linha 50)
Trocar `new Date(instance.internal_target_at)` por `new Date(instance.internal_target_at + 'T00:00:00')`.

### 6. `src/lib/obligation-status-utils.ts` (linha 84)
Trocar `new Date(internalTargetAt)` por parsing seguro. Como o parâmetro pode ser `string | Date`, tratar condicionalmente:
```typescript
const targetDate = typeof internalTargetAt === 'string' 
  ? new Date(internalTargetAt + 'T00:00:00') 
  : internalTargetAt;
```

### 7. `src/hooks/cliente/useDashboardData.ts` (linhas 18-19)
Trocar `toISOString().split('T')[0]` por `format(startDate, 'yyyy-MM-dd')` do date-fns, que usa horário local.

---

## Resumo

- **9 vulnerabilidades** encontradas em 7 arquivos
- **0 alterações no banco de dados** necessárias
- Todas as correções são de 1 linha cada — substituição de parsing UTC por local

