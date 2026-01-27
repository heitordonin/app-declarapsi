
# Plano de Correção de Bugs Identificados na Área do Cliente

## Resumo Executivo

Este plano detalha a correção de 3 bugs identificados durante a auditoria da área do cliente, ordenados por prioridade de impacto.

---

## Bug 1: Cobranças do Paciente Não Carregando (CRÍTICO)

### Problema Identificado

A função `toDisplayModel` em `usePatientsData.ts` (linhas 78-95) retorna valores zerados e arrays vazios para o resumo financeiro e histórico de cobranças do paciente:

```typescript
// Código atual - sempre retorna zeros
financial: {
  toReceive: 0,
  overdue: 0,
  received: 0,
},
pendingCharges: [],
receivedCharges: [],
```

Isso faz com que `PatientDetails`, `PatientFinancialSummary` e `PatientCharges` exibam sempre "R$ 0,00" e "Nenhuma cobrança".

### Causa Raiz

A query atual busca apenas dados da tabela `patients` sem fazer join com a tabela `charges`. Não há integração entre pacientes e suas cobranças.

### Solução Proposta

#### Passo 1: Modificar a Query em `usePatientsData.ts`

Alterar a query para incluir um join com a tabela `charges`:

```typescript
const { data, error } = await supabase
  .from('patients')
  .select(`
    *,
    charges(
      id,
      description,
      amount,
      status,
      due_date,
      payment_date
    )
  `)
  .order('name');
```

#### Passo 2: Atualizar Interface `Patient`

Adicionar campo para armazenar as cobranças do banco:

```typescript
export interface Patient {
  // ... campos existentes
  charges?: {
    id: string;
    description: string;
    amount: number;
    status: 'pending' | 'overdue' | 'paid';
    due_date: string;
    payment_date: string | null;
  }[];
}
```

#### Passo 3: Refatorar `toDisplayModel`

Calcular valores financeiros e separar cobranças por tipo:

```typescript
function toDisplayModel(patient: Patient): PatientDisplayModel {
  const charges = patient.charges || [];
  const today = new Date();
  
  // Separar cobranças por status
  const pendingCharges = charges
    .filter(c => c.status !== 'paid')
    .map(c => ({
      id: c.id,
      description: c.description,
      dueDate: c.due_date,
      value: Number(c.amount),
    }));
    
  const receivedCharges = charges
    .filter(c => c.status === 'paid')
    .map(c => ({
      id: c.id,
      description: c.description,
      paymentDate: c.payment_date || c.due_date,
      value: Number(c.amount),
    }));
  
  // Calcular totais
  const toReceive = charges
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + Number(c.amount), 0);
    
  const overdue = charges
    .filter(c => c.status === 'overdue')
    .reduce((sum, c) => sum + Number(c.amount), 0);
    
  const received = charges
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return {
    id: patient.id,
    name: patient.name,
    cpf: patient.document || '',
    email: patient.email,
    phone: patient.phone,
    type: patient.type,
    tags: patient.is_foreign_payment ? ['Pagamento do exterior'] : [],
    financial: {
      toReceive,
      overdue,
      received,
    },
    pendingCharges,
    receivedCharges,
  };
}
```

#### Passo 4: Invalidar Cache de Pacientes

Atualizar `useChargesData.ts` para invalidar também a query de pacientes quando uma cobrança é modificada:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['charges'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-charges'] });
  queryClient.invalidateQueries({ queryKey: ['patients'] }); // ADICIONAR
},
```

### Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/hooks/cliente/usePatientsData.ts` | Modificar query e toDisplayModel |
| `src/hooks/cliente/useChargesData.ts` | Adicionar invalidação de cache |

### Resultado Esperado

- `PatientFinancialSummary` exibe valores reais de "A receber", "Vencidas" e "Recebido"
- `PatientCharges` lista as cobranças pendentes e recebidas do paciente
- Alterações em cobranças refletem imediatamente nos detalhes do paciente

---

## Bug 2: Erro de Runtime em PaymentCard (ALTA)

### Problema Identificado

Na linha 99 de `PaymentCard.tsx`, o código tenta criar um Date diretamente sem verificação de nulidade:

```typescript
{format(new Date(payment.dueDate), 'dd/MM/yyyy')}
```

Se `payment.dueDate` for `null` ou `undefined`, isso causa um erro de runtime que pode quebrar a aplicação.

### Causa Raiz

A interface `Payment` em `usePaymentsData.ts` define `dueDate` como `string`, mas documentos podem ter `due_at` nulo no banco de dados.

### Solução Proposta

#### Passo 1: Adicionar Verificação de Nulidade

```typescript
<div className="flex justify-between items-center">
  <span className="text-sm text-muted-foreground">Vencimento:</span>
  <span className="text-foreground">
    {payment.dueDate 
      ? format(new Date(payment.dueDate), 'dd/MM/yyyy')
      : 'Sem vencimento'
    }
  </span>
</div>
```

#### Passo 2: Atualizar Interface Payment (Opcional)

Para maior clareza, atualizar o tipo em `usePaymentsData.ts`:

```typescript
export interface Payment {
  // ... outros campos
  dueDate: string | null;  // Tornar nullable explicitamente
}
```

### Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/components/cliente/pagamentos/PaymentCard.tsx` | Adicionar verificação de null |
| `src/hooks/cliente/usePaymentsData.ts` | Atualizar tipo (opcional) |

### Resultado Esperado

- Aplicação não quebra quando um documento não tem data de vencimento
- Exibe "Sem vencimento" como fallback amigável

---

## Bug 3: Padding Duplicado no Dashboard (MÉDIA)

### Problema Identificado

O `Dashboard.tsx` aplica padding interno (`p-4 md:p-6`) na linha 24:

```typescript
<div className="p-4 md:p-6 space-y-6">
```

Enquanto o `ClienteLayout.tsx` já aplica padding no container do Outlet na linha 96:

```typescript
<div className="p-6">
  <Outlet />
</div>
```

Isso resulta em padding duplicado (p-6 + p-4/p-6 = 40-48px de padding).

### Causa Raiz

Falta de padronização entre o layout principal e as páginas internas sobre quem é responsável pelo espaçamento.

### Solução Proposta (Opção Recomendada)

Remover o padding do `Dashboard.tsx` e manter apenas no `ClienteLayout`:

#### Modificar Dashboard.tsx

```typescript
// ANTES
<div className="p-4 md:p-6 space-y-6">

// DEPOIS
<div className="space-y-6">
```

#### Verificar Outras Páginas

Garantir que outras páginas da área do cliente também não tenham padding interno redundante:
- `/cliente/receitas`
- `/cliente/despesas`
- `/cliente/pagamentos`
- `/cliente/documentos`
- `/cliente/comunicados`
- `/cliente/pacientes`
- `/cliente/perfil`

### Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/Dashboard.tsx` | Remover padding interno |
| Outras páginas em `/cliente/*` | Verificar e remover padding se necessário |

### Resultado Esperado

- Espaçamento consistente em todas as páginas do módulo cliente
- Padding único gerenciado pelo `ClienteLayout`

---

## Resumo de Alterações por Arquivo

| Arquivo | Bug | Complexidade |
|---------|-----|--------------|
| `src/hooks/cliente/usePatientsData.ts` | Bug 1 | Alta |
| `src/hooks/cliente/useChargesData.ts` | Bug 1 | Baixa |
| `src/components/cliente/pagamentos/PaymentCard.tsx` | Bug 2 | Baixa |
| `src/pages/cliente/Dashboard.tsx` | Bug 3 | Baixa |

## Ordem de Implementação Sugerida

1. **Bug 2** (PaymentCard) - Correção rápida, previne crashes
2. **Bug 3** (Dashboard padding) - Correção rápida, melhora visual
3. **Bug 1** (Patient charges) - Mais complexa, requer refatoração

## Testes Recomendados

1. Navegar para `/cliente/pacientes` e verificar se cobranças aparecem
2. Abrir `/cliente/pagamentos` e verificar se não há erros de console
3. Verificar espaçamento em todas as páginas do módulo cliente
4. Criar/editar cobrança e verificar atualização nos detalhes do paciente
