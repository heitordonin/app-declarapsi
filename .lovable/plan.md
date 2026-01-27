
# Funcionalidade: Marcar Pagamento como Pago + Registrar Despesa

## Resumo

Adicionar funcionalidade para o cliente marcar um documento de pagamento (guia/DARF) como pago, informando a data do pagamento e opcionalmente registrando automaticamente o valor como despesa na categoria "DARF Carne-Leao".

## Contexto Atual

A pagina `/cliente/pagamentos` exibe documentos fiscais enviados pelo contador (guias de impostos). Atualmente o cliente pode apenas visualizar e baixar os documentos. Os status existentes sao:
- **Pendente**: Documento enviado, ainda nao visualizado
- **Visualizado**: Documento foi baixado/visto pelo cliente
- **Vencido**: Data de vencimento passou

## Nova Funcionalidade

Adicionar um novo status **Pago** e permitir que o cliente:
1. Marque o documento como pago
2. Informe a data do pagamento
3. Opcionalmente registre como despesa automaticamente

## Arquitetura da Solucao

```text
+------------------+     +----------------------+     +------------------+
| PaymentCard.tsx  | --> | MarkPaymentAsPaid    | --> | usePaymentsData  |
| (botao "Pagar")  |     | Dialog.tsx           |     | (mutation)       |
+------------------+     +----------------------+     +------------------+
                                   |
                                   v
                         +------------------+
                         | useExpensesData  |
                         | (criar despesa)  |
                         +------------------+
```

## Alteracoes no Banco de Dados

### 1. Nova coluna na tabela `documents`

```sql
ALTER TABLE documents 
ADD COLUMN paid_at timestamp with time zone DEFAULT NULL;
```

Esta coluna armazena quando o cliente marcou o documento como pago.

## Alteracoes no Frontend

### 1. Novo tipo Payment (usePaymentsData.ts)

Adicionar novo status "paid" ao tipo PaymentStatus:
```typescript
export type PaymentStatus = 'pending' | 'viewed' | 'overdue' | 'paid';
```

Adicionar campo `paidAt` ao interface Payment:
```typescript
paidAt: string | null;
```

Atualizar logica de status para priorizar "paid":
```typescript
const getPaymentStatus = (dueAt: Date, viewedAt: string | null, paidAt: string | null): PaymentStatus => {
  if (paidAt) return 'paid';
  const today = startOfDay(new Date());
  if (isBefore(dueAt, today)) return 'overdue';
  if (viewedAt) return 'viewed';
  return 'pending';
};
```

### 2. Nova mutation em usePaymentsData.ts

```typescript
const markAsPaidMutation = useMutation({
  mutationFn: async ({ documentId, paidAt }: { documentId: string; paidAt: Date }) => {
    const { error } = await supabase
      .from('documents')
      .update({ paid_at: paidAt.toISOString() })
      .eq('id', documentId);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['client-payments'] });
  },
});
```

### 3. Novo componente: MarkPaymentAsPaidDialog.tsx

Criar em `src/components/cliente/pagamentos/`:
- Usa Drawer no mobile (padrao do sistema)
- Usa AlertDialog no desktop
- Campos:
  - DatePicker para data do pagamento
  - Checkbox "Registrar como despesa"
- Resumo do documento (titulo, valor, vencimento)
- Validacao de periodo fiscal via `canMarkAsPaidOnDate()`
- Se checkbox marcado, cria despesa automaticamente na categoria "DARF Carne-Leao"

### 4. Atualizar PaymentCard.tsx

**Antes:**
- Apenas botao "Baixar"

**Depois:**
- Botao "Baixar" 
- Botao "Pagar" (apenas se status != 'paid')
- Se status = 'paid': mostrar badge "Pago" e data do pagamento

Layout mobile-first otimizado:
```text
+------------------------------------------+
| [Novo]  Titulo do documento        2h    |
|                                          |
| Valor: R$ 150,00                         |
| Vencimento: 15/02/2026                   |
| Status: [Pendente]                       |
|                                          |
|     [Baixar]        [Pagar]              |
+------------------------------------------+
```

Quando pago:
```text
+------------------------------------------+
| Titulo do documento                 2h   |
|                                          |
| Valor: R$ 150,00                         |
| Vencimento: 15/02/2026                   |
| Status: [Pago em 10/02/2026]             |
|                                          |
|              [Baixar]                    |
+------------------------------------------+
```

### 5. Atualizar statusConfig em PaymentCard.tsx

```typescript
const statusConfig = {
  pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 ...' },
  viewed: { label: 'Visualizado', className: 'bg-blue-100 text-blue-800 ...' },
  overdue: { label: 'Vencido', className: 'bg-red-100 text-red-800 ...' },
  paid: { label: 'Pago', className: 'bg-green-100 text-green-800 ...' },
};
```

### 6. Atualizar RLS policy (documents)

A policy existente "Clients can mark documents as viewed" ja permite UPDATE. Verificar se precisa ajustar para incluir `paid_at`.

## Fluxo do Usuario

1. Cliente acessa `/cliente/pagamentos`
2. Visualiza lista de documentos com novo botao "Pagar"
3. Clica em "Pagar" no documento desejado
4. Drawer abre (mobile) ou Dialog abre (desktop)
5. Cliente seleciona data do pagamento
6. Cliente decide se quer registrar como despesa (checkbox)
7. Clica em "Confirmar Pagamento"
8. Sistema:
   - Valida periodo fiscal
   - Atualiza `paid_at` no documento
   - Se checkbox marcado: cria despesa na categoria "DARF Carne-Leao"
9. Card atualiza para mostrar status "Pago"

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/hooks/cliente/usePaymentsData.ts` | Modificar: adicionar paidAt, novo status, mutation |
| `src/components/cliente/pagamentos/PaymentCard.tsx` | Modificar: novo botao, novo status, layout |
| `src/components/cliente/pagamentos/MarkPaymentAsPaidDialog.tsx` | Criar: dialog responsivo |
| `src/pages/cliente/Pagamentos.tsx` | Modificar: gerenciar estado do dialog |

## Integracao com Despesas

Quando o cliente marcar checkbox "Registrar como despesa":
- Categoria: "DARF Carne-Leao" (id: `5bdb11af-bb34-4eda-a864-c2a400f0e7a9`)
- Valor: `payment.value` (valor do documento)
- Data pagamento: data selecionada no dialog
- Competencia: extraida do campo `competence` do documento (formato "yyyy-MM")
- Descricao: nome do documento/obrigacao

## Validacoes

1. **Periodo fiscal**: Usar `canMarkAsPaidOnDate()` de `charge-period-utils.ts`
2. **Documento ja pago**: Nao mostrar botao "Pagar" se `paidAt` existe
3. **Valor obrigatorio**: So habilitar checkbox de despesa se `payment.value` existe

## UX Melhorias Incluidas

1. **Layout mobile-first**: Botoes com tamanho touch-friendly (44px)
2. **Drawer responsivo**: Abre de baixo no mobile, dialog centralizado no desktop
3. **Feedback visual**: Badge verde com data quando pago
4. **Confirmacao clara**: Resumo do documento antes de confirmar
5. **Checkbox opcional**: Registrar despesa nao e obrigatorio
