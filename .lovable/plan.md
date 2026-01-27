
# Reconhecimento Automatico de Categoria: DARF vs INSS

## Resumo

Atualizar a funcionalidade de "Marcar como Pago" para identificar automaticamente se o documento e um DARF ou INSS e registrar na categoria de despesa correta.

## Contexto

O sistema possui duas categorias de despesas para pagamentos fiscais:
- **DARF Carne-Leao** (id: `5bdb11af-bb34-4eda-a864-c2a400f0e7a9`)
- **INSS - Previdencia Social** (id: `7993b8a5-3bbd-484e-ba43-c78bf1fe8c9b`)

As obrigacoes cadastradas sao:
- "DARF Carne Leao" - deve registrar como DARF
- "INSS 1007" - deve registrar como INSS
- "INSS 1163" - deve registrar como INSS

## Arquitetura da Solucao

```text
+------------------+     +----------------------+     +------------------+
| documents        | --> | Payment interface    | --> | Pagamentos.tsx   |
| obligation_id    |     | + obligationName     |     | detecta categoria|
+------------------+     +----------------------+     +------------------+
                                                              |
                                                              v
                                                    +------------------+
                                                    | DARF? → DARF ID  |
                                                    | INSS? → INSS ID  |
                                                    +------------------+
```

## Alteracoes no Codigo

### 1. usePaymentsData.ts

Adicionar o campo `obligationName` ao interface Payment:

```typescript
export interface Payment {
  id: string;
  title: string;
  value: number | null;
  dueDate: string;
  status: PaymentStatus;
  deliveredAt: string;
  isNew: boolean;
  filePath: string;
  fileName: string;
  competence: string;
  viewedAt: string | null;
  paidAt: string | null;
  obligationName: string | null;  // NOVO CAMPO
}
```

Atualizar o mapeamento para incluir o nome da obrigacao:

```typescript
return {
  // ... campos existentes
  obligationName: doc.obligation?.name || null,
};
```

### 2. Pagamentos.tsx

Criar funcao helper para determinar a categoria correta:

```typescript
// Mapeamento de categorias
const DARF_CATEGORY_ID = '5bdb11af-bb34-4eda-a864-c2a400f0e7a9';
const INSS_CATEGORY_ID = '7993b8a5-3bbd-484e-ba43-c78bf1fe8c9b';

function getExpenseCategoryId(obligationName: string | null): string | null {
  if (!obligationName) return null;
  
  const normalizedName = obligationName.toUpperCase();
  
  if (normalizedName.includes('INSS')) {
    return INSS_CATEGORY_ID;
  }
  
  if (normalizedName.includes('DARF') || normalizedName.includes('CARNÊ')) {
    return DARF_CATEGORY_ID;
  }
  
  return null;
}

function getExpenseCategoryName(obligationName: string | null): string | null {
  if (!obligationName) return null;
  
  const normalizedName = obligationName.toUpperCase();
  
  if (normalizedName.includes('INSS')) {
    return 'INSS - Previdência Social';
  }
  
  if (normalizedName.includes('DARF') || normalizedName.includes('CARNÊ')) {
    return 'DARF Carnê-Leão';
  }
  
  return null;
}
```

Atualizar `handleConfirmPayment`:

```typescript
const handleConfirmPayment = async (paymentDate: Date, registerAsExpense: boolean) => {
  if (!selectedPayment) return;
  
  setIsProcessing(true);
  try {
    await markAsPaid({ documentId: selectedPayment.id, paidAt: paymentDate });

    if (registerAsExpense && selectedPayment.value) {
      const categoryId = getExpenseCategoryId(selectedPayment.obligationName);
      
      if (!categoryId) {
        toast.warning('Não foi possível identificar a categoria da despesa.');
        // Ainda marca como pago, mas não registra despesa
      } else {
        const [competencyYear, competencyMonth] = selectedPayment.competence.split('-').map(Number);
        
        await createExpense.mutateAsync({
          categoryId: categoryId,  // USA CATEGORIA DINAMICA
          value: selectedPayment.value.toString(),
          paymentDate: format(paymentDate, 'yyyy-MM-dd'),
          isResidentialExpense: false,
          competencyMonth,
          competencyYear,
          description: selectedPayment.title,
        });
      }
    }

    toast.success(
      registerAsExpense 
        ? 'Pagamento confirmado e despesa registrada!' 
        : 'Pagamento confirmado!'
    );
    // ...
  }
};
```

### 3. MarkPaymentAsPaidDialog.tsx

Atualizar props para receber o nome da categoria:

```typescript
interface MarkPaymentAsPaidDialogProps {
  payment: Payment | null;
  expenseCategoryName: string | null;  // NOVO PROP
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (paymentDate: Date, registerAsExpense: boolean) => Promise<void>;
  isLoading?: boolean;
}
```

Atualizar o texto do checkbox para mostrar a categoria correta:

```typescript
<p className="text-xs text-muted-foreground">
  O valor será registrado automaticamente na categoria 
  "{expenseCategoryName || 'Não identificada'}"
</p>
```

Se a categoria nao for identificada, desabilitar o checkbox:

```typescript
const canRegisterAsExpense = hasValue && !!expenseCategoryName;

{hasValue && (
  <div className="flex items-start space-x-3 pt-2">
    <Checkbox
      id="register-expense"
      checked={registerAsExpense}
      onCheckedChange={(checked) => setRegisterAsExpense(checked === true)}
      disabled={!isDateAllowed || !canRegisterAsExpense}
    />
    <div className="space-y-1">
      <Label>Registrar como despesa</Label>
      <p className="text-xs text-muted-foreground">
        {expenseCategoryName 
          ? `O valor será registrado na categoria "${expenseCategoryName}"`
          : 'Categoria não identificada - não é possível registrar como despesa'
        }
      </p>
    </div>
  </div>
)}
```

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `src/hooks/cliente/usePaymentsData.ts` | Adicionar campo `obligationName` ao Payment |
| `src/pages/cliente/Pagamentos.tsx` | Adicionar logica de deteccao de categoria |
| `src/components/cliente/pagamentos/MarkPaymentAsPaidDialog.tsx` | Receber e exibir nome da categoria |

## Fluxo Atualizado

1. Usuario clica "Pagar" no documento
2. Sistema identifica o tipo: DARF ou INSS baseado no `obligationName`
3. Dialog mostra a categoria que sera usada: "DARF Carne-Leao" ou "INSS - Previdencia Social"
4. Usuario confirma
5. Sistema registra despesa na categoria correta

## Validacoes

1. Se `obligationName` nao contem "INSS" nem "DARF/CARNE", nao permite registrar como despesa
2. Checkbox de despesa so aparece se a categoria foi identificada
3. Toast de warning se categoria nao identificada

## Extensibilidade

A funcao `getExpenseCategoryId` pode ser facilmente estendida para suportar novos tipos de obrigacoes no futuro, bastando adicionar novas condicoes de mapeamento.
