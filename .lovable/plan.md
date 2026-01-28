
# Plano: Exportacao em Lote no Modulo de Gestao Mensal

## Objetivo

Permitir que o contador selecione multiplos clientes na tabela de Gestao Mensal e exporte os dados de todos de uma so vez, gerando arquivos CSV individuais para cada cliente no formato Carne Leao.

---

## Fluxo de Usuario

```text
1. Contador acessa /contador/gestao
     |
     v
2. Tabela exibe checkbox na primeira coluna de cada linha
     |
     v
3. Contador seleciona clientes desejados (ou "Selecionar todos")
     |
     v
4. Botao "Exportar X clientes" aparece na barra de acoes
     |
     v
5. Clica no botao -> Abre dialog de confirmacao
     |
     v
6. Confirma -> Sistema gera arquivos CSV para cada cliente
     |
     v
7. Arquivos sao baixados automaticamente (download sequencial)
     |
     v
8. Toast informa sucesso: "12 arquivo(s) exportado(s) para 6 cliente(s)"
```

---

## Interface Proposta

### Tabela com Selecao

```text
+---+----------------------------------------------------------+
| [ ] Selecionar todos                                         |
+---+----------------------------------------------------------+
| Checkbox | Cliente      | Faturamento | Rec | Desp | Status  |
|----------|--------------|-------------|-----|------|---------|
| [x]      | Maria Silva  | R$ 8.500    | 32  | 5    | [R] [D] |
| [x]      | Joao Santos  | R$ 6.200    | 24  | 8    | [R] [ ] |
| [ ]      | Ana Costa    | R$ 4.100    | 18  | 3    | [ ] [ ] |
+---+----------------------------------------------------------+

           [ Exportar 2 clientes ]  <- Botao flutuante/fixo
```

### Dialog de Exportacao em Lote

```text
+--------------------------------------------------+
|        Exportar em Lote - Carne Leao             |
+--------------------------------------------------+
|                                                  |
|  Periodo: Janeiro de 2026                        |
|                                                  |
|  Clientes selecionados: 6                        |
|  - Total de receitas: 142 registros              |
|  - Total de despesas: 38 registros               |
|                                                  |
|  [ ] Exportar Rendimentos (Receita Saude)        |
|  [ ] Exportar Despesas Dedutiveis (P10)          |
|                                                  |
|  [ ] Marcar como exportado apos download         |
|                                                  |
|  [ Cancelar ]              [ Exportar Todos ]    |
+--------------------------------------------------+
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/gestao/BatchExportDialog.tsx` | Dialog de exportacao em lote |
| `src/hooks/contador/useBatchExport.ts` | Hook para buscar dados de multiplos clientes |

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/gestao/ClientStatsTable.tsx` | Adicionar checkboxes de selecao e callback para clientes selecionados |
| `src/pages/contador/Gestao.tsx` | Gerenciar estado de selecao e integrar dialog de lote |

---

## Detalhes Tecnicos

### 1. ClientStatsTable - Selecao de Clientes

Adicionar:
- Coluna de checkbox no inicio de cada linha
- Checkbox "Selecionar todos" no header
- Callback `onSelectionChange(selectedIds: Set<string>)` para o pai
- Estado interno `selectedIds: Set<string>`

```typescript
interface ClientStatsTableProps {
  // ... existentes
  onSelectionChange?: (selectedIds: Set<string>) => void;
  selectedIds?: Set<string>;
}
```

### 2. Gestao.tsx - Gerenciamento de Estado

Adicionar:
- Estado `selectedClientIds: Set<string>`
- Botao de exportacao em lote (visivel quando `selectedClientIds.size > 0`)
- Estado para controlar abertura do `BatchExportDialog`

### 3. useBatchExport Hook

Hook que busca dados de multiplos clientes em paralelo:

```typescript
interface BatchExportFilters {
  clientIds: string[];
  month: number;
  year: number;
}

interface BatchExportResult {
  clientId: string;
  clientName: string;
  data: ClientExportData;
  hasErrors: boolean;
  errorMessage?: string;
}

export function useBatchExport(filters: BatchExportFilters | null) {
  return useQuery({
    queryKey: ['batch-export', filters?.clientIds, filters?.month, filters?.year],
    queryFn: async (): Promise<BatchExportResult[]> => {
      // Busca dados de todos os clientes em paralelo
      const promises = filters!.clientIds.map(clientId => 
        fetchClientExportData(clientId, filters!.month, filters!.year)
      );
      return Promise.all(promises);
    },
    enabled: !!filters && filters.clientIds.length > 0,
  });
}
```

### 4. BatchExportDialog - Logica de Exportacao

O dialog ira:
1. Receber lista de `clientIds` selecionados
2. Carregar dados de todos os clientes usando `useBatchExport`
3. Exibir resumo (total de receitas/despesas)
4. Validar CPFs de todos os clientes
5. Gerar arquivos CSV para cada cliente
6. Download sequencial (com pequeno delay para evitar bloqueio do browser)
7. Opcionalmente marcar todos como exportados

```typescript
// Download sequencial com delay
async function downloadAllFiles(files: { content: string; filename: string }[]) {
  for (const file of files) {
    downloadCsv(file.content, file.filename);
    await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
  }
}
```

---

## Validacoes

1. **CPFs Invalidos**: Clientes com CPFs invalidos serao listados e excluidos da exportacao
2. **Sem Lancamentos**: Clientes sem receitas/despesas no periodo serao avisados
3. **Limite por Arquivo**: Cada arquivo individual respeita o limite de 1000 linhas

---

## Nomenclatura dos Arquivos

Cada cliente gera seus proprios arquivos:
- `Maria Silva_receita saude_01-2026.csv`
- `Maria Silva_despesas_01-2026.csv`
- `Joao Santos_receita saude_01-2026.csv`
- `Joao Santos_despesas_01-2026.csv`
- ...

---

## Opcao: Marcar como Exportado

Checkbox opcional no dialog:
- Se marcado, apos o download bem-sucedido, o sistema automaticamente marca `charges_exported_at` e/ou `expenses_exported_at` para todos os clientes exportados

```typescript
if (markAsExported) {
  await Promise.all(
    successfulExports.map(clientId => 
      Promise.all([
        exportCharges && markExported({ clientId, type: 'charges' }),
        exportExpenses && markExported({ clientId, type: 'expenses' }),
      ])
    )
  );
}
```

---

## Feedback Visual

### Durante Exportacao

```text
+--------------------------------------------------+
|  Exportando...                                   |
|                                                  |
|  [=========>                    ] 3/6 clientes   |
|                                                  |
|  Gerando: Joao Santos...                         |
+--------------------------------------------------+
```

### Resultado

```text
Toast: "Exportacao em lote concluida"
       "12 arquivos gerados para 6 clientes.
        2 clientes ignorados (CPF invalido)."
```

---

## Consideracoes de UX

1. **Persistencia de Selecao**: A selecao e limpa ao mudar o mes/ano selecionado
2. **Filtro de Busca**: Selecionar todos considera apenas clientes visiveis (apos filtro)
3. **Desabilitar durante Carregamento**: Botao de exportar desabilitado enquanto dados estao carregando
4. **Limite de Selecao**: Considerar alertar se mais de 50 clientes forem selecionados (muitos downloads)

---

## Testes Recomendados

1. Selecionar 2-3 clientes e exportar - verificar arquivos gerados
2. Testar com cliente sem dados no periodo - deve ser ignorado
3. Testar com cliente com CPF invalido - deve alertar e permitir continuar sem ele
4. Testar "Selecionar todos" com filtro de busca ativo
5. Testar marcacao automatica como exportado
6. Verificar que downloads nao bloqueiam o browser (delay entre arquivos)
