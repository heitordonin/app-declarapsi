

# Bug: Vencimento aparece com -1 dia em /cliente/pagamentos

## Causa Raiz

O campo `due_at` no banco de dados é do tipo `date` (sem horário), retornando strings como `"2025-03-15"`. Quando o JavaScript faz `new Date("2025-03-15")`, interpreta como **UTC meia-noite**. No fuso horário do Brasil (UTC-3), isso resulta em `14/03/2025 às 21:00`, ou seja, o **dia anterior**.

Esse é um bug clássico de timezone com datas puras.

## Correção

Substituir `new Date(dateString)` por parsing seguro que ignora timezone. A solução mais simples é adicionar `T00:00:00` à string de data antes de criar o objeto Date, forçando interpretação como horário local.

### Arquivos afetados

**1. `src/hooks/cliente/usePaymentsData.ts`** (linha 50)
```typescript
// De:
const dueDate = new Date(doc.due_at);
// Para:
const dueDate = new Date(doc.due_at + 'T00:00:00');
```

**2. `src/components/cliente/pagamentos/PaymentCard.tsx`** (linha 100)
```typescript
// De:
format(new Date(payment.dueDate), 'dd/MM/yyyy')
// Para:
format(new Date(payment.dueDate + 'T00:00:00'), 'dd/MM/yyyy')
```

**3. `src/pages/cliente/Pagamentos.tsx`** (linha ~80, filtro por mês)
```typescript
// De:
format(new Date(payment.dueDate), 'yyyy-MM')
// Para:
format(new Date(payment.dueDate + 'T00:00:00'), 'yyyy-MM')
```

## Resumo

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `usePaymentsData.ts` | 50 | Corrigir parsing de `due_at` |
| `PaymentCard.tsx` | 100 | Corrigir exibição do vencimento |
| `Pagamentos.tsx` | ~80 | Corrigir filtro por mês |

Três linhas corrigidas, zero impacto em outras funcionalidades.

