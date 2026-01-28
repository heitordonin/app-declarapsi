
# Plano de Exportacao CSV para Carne Leao

## Resumo Executivo

Implementar a funcionalidade de exportacao de dados financeiros de clientes em formato CSV, permitindo que o contador baixe planilhas prontas para importacao no Carne Leao Web. Nesta primeira fase, construiremos apenas o front-end com a interface de selecao e geracao local do CSV.

---

## Contexto do Carne Leao

O Carne Leao Web da Receita Federal permite importacao de:
- **Receitas**: rendimentos recebidos de pessoas fisicas
- **Despesas**: gastos dedutiveis do livro-caixa

Os layouts especificos de importacao serao definidos numa segunda etapa. Por enquanto, criaremos uma estrutura generica que podera ser adaptada.

---

## Arquitetura da Solucao

### Fluxo de Usuario

```text
Pagina Clientes
     |
     v
Dropdown de Acoes do Cliente
     |
     v
"Exportar dados" -> Abre Dialog
     |
     v
Dialog de Exportacao:
  - Seleciona Periodo (Mes/Ano)
  - Seleciona tipo: Receitas / Despesas / Ambos
  - Clique em Exportar
     |
     v
Gera CSV localmente e faz download
```

---

## Componentes a Criar

### 1. Hook de Exportacao: `useClientExport.ts`

Responsavel por buscar dados de receitas e despesas de um cliente especifico para um periodo.

```typescript
// src/hooks/contador/useClientExport.ts

interface ExportFilters {
  clientId: string;
  month: number;  // 1-12
  year: number;
}

interface ChargeExportData {
  paymentDate: string;
  patientCpf: string;
  payerCpf: string;
  patientName: string;
  description: string;
  amount: number;
  sessionsCount: number;
}

interface ExpenseExportData {
  paymentDate: string;
  categoryCode: string;
  categoryName: string;
  originalAmount: number;
  deductibleAmount: number;
  isResidential: boolean;
  description: string | null;
}

export function useClientExport(filters: ExportFilters | null)
```

### 2. Utilitario CSV: `csv-utils.ts`

Funcoes puras para geracao de CSV.

```typescript
// src/lib/csv-utils.ts

// Escapa valores para CSV (aspas, virgulas, quebras de linha)
function escapeCsvValue(value: string | number | null): string

// Gera string CSV a partir de array de objetos
function generateCsv<T>(data: T[], columns: CsvColumn<T>[]): string

// Trigger download do arquivo
function downloadCsv(content: string, filename: string): void
```

### 3. Dialog de Exportacao: `ExportClientDataDialog.tsx`

Dialog que permite selecionar periodo e tipo de exportacao.

```typescript
// src/components/clientes/ExportClientDataDialog.tsx

interface Props {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// UI:
// - Seletor de Mes (Janeiro a Dezembro)
// - Seletor de Ano (ultimos 2 anos + ano atual)
// - Checkbox: Exportar Receitas
// - Checkbox: Exportar Despesas
// - Botao: Exportar
```

---

## Alteracoes em Arquivos Existentes

### ClientesList.tsx

Adicionar opcao "Exportar dados" no menu de acoes de cada cliente:

```typescript
// Adicionar no DropdownMenuContent (apos Editar)
<DropdownMenuItem onClick={() => setClientToExport(client)}>
  <Download className="mr-2 h-4 w-4" />
  Exportar dados
</DropdownMenuItem>
```

---

## Formato do CSV de Receitas

| Coluna | Descricao | Exemplo |
|--------|-----------|---------|
| data_pagamento | Data do recebimento | 15/01/2024 |
| cpf_paciente | CPF do paciente | 12345678900 |
| cpf_pagador | CPF de quem pagou | 12345678900 |
| nome_paciente | Nome do paciente | Maria Silva |
| descricao | Descricao do servico | Sessao de psicoterapia |
| valor | Valor recebido | 250.00 |
| quantidade_sessoes | Numero de sessoes | 4 |

### Exemplo CSV Receitas

```text
data_pagamento,cpf_paciente,cpf_pagador,nome_paciente,descricao,valor,quantidade_sessoes
15/01/2024,12345678900,12345678900,Maria Silva,Sessao de psicoterapia,250.00,4
20/01/2024,98765432100,11122233344,Joao Santos,Avaliacao psicologica,350.00,1
```

---

## Formato do CSV de Despesas

| Coluna | Descricao | Exemplo |
|--------|-----------|---------|
| data_pagamento | Data do pagamento | 10/01/2024 |
| codigo_categoria | Codigo da categoria | P10.01.00015 |
| categoria | Nome da categoria | Contador |
| valor_original | Valor pago | 500.00 |
| valor_dedutivel | Valor dedutivel | 500.00 |
| residencial | Se e despesa residencial | Nao |
| descricao | Descricao adicional | Honorarios janeiro |

### Exemplo CSV Despesas

```text
data_pagamento,codigo_categoria,categoria,valor_original,valor_dedutivel,residencial,descricao
10/01/2024,P10.01.00015,Contador,500.00,500.00,Nao,Honorarios janeiro
05/01/2024,P10.01.00007,Energia,200.00,40.00,Sim,Conta de luz
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/lib/csv-utils.ts` | Utilitarios de geracao CSV |
| `src/hooks/contador/useClientExport.ts` | Hook para buscar dados de exportacao |
| `src/components/clientes/ExportClientDataDialog.tsx` | Dialog de exportacao |

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/clientes/ClientesList.tsx` | Adicionar opcao de exportar no menu e estado para dialog |

---

## Regras de Negocio

1. **Filtro por periodo**: Apenas cobranças com `payment_date` no mes/ano selecionado (receitas efetivamente recebidas)
2. **Filtro por periodo despesas**: Despesas com `payment_date` no mes/ano selecionado
3. **Status paid apenas**: Somente receitas com status = 'paid' sao exportadas
4. **Valores numericos**: Usar ponto como separador decimal (padrao CSV)
5. **Datas**: Formato DD/MM/YYYY para compatibilidade com Excel brasileiro
6. **Encoding**: UTF-8 com BOM para Excel reconhecer acentos

---

## Testes Recomendados

1. Exportar receitas de um cliente com dados no periodo selecionado
2. Exportar despesas de um cliente com dados no periodo
3. Testar exportacao de periodo sem dados (deve gerar CSV so com cabecalho)
4. Verificar que arquivo abre corretamente no Excel
5. Verificar que acentos aparecem corretamente
6. Testar com cliente sem receitas/despesas cadastradas

---

## Proximos Passos (Fase 2)

Apos validar o front-end, implementaremos:
1. Layouts especificos do Carne Leao Web (quando voce fornecer a documentacao)
2. Layouts especificos do Receita Saude
3. Possivelmente mover geracao para Edge Function se volumes forem grandes

---

## Impacto Esperado

- Contador pode exportar dados de clientes em segundos
- Formato CSV compativel com Excel e sistemas da Receita
- Reducao significativa de trabalho manual na importacao
- Base preparada para layouts especificos na proxima fase
