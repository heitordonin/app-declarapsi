
# Plano de Adaptacao para Layout Oficial do Carne Leao Web

## Resumo Executivo

Adaptar o sistema de exportacao existente para gerar arquivos CSV 100% compativeis com o Carne Leao Web da Receita Federal. O manual fornecido define layouts especificos para:
- **Rendimentos com Receita Saude** (16 campos)
- **Pagamentos Dedutiveis P10** (4-7 campos)

---

## Principais Diferencas vs Implementacao Atual

| Aspecto | Atual | Carne Leao |
|---------|-------|------------|
| Separador | Virgula (`,`) | Ponto e virgula (`;`) |
| Cabecalho | Sim | Nao (apenas dados) |
| Valor monetario | `1500.00` | `1500,00` |
| Campos extras | Nome paciente, qtd sessoes | Codigo ocupacao, indicadores |
| Layout receitas | 7 campos proprios | 16 campos oficiais |
| Layout despesas | 7 campos proprios | 4 campos minimos |

---

## Arquitetura da Solucao

### Dois Modos de Exportacao

O sistema oferecera duas opcoes:

1. **Formato Interno (atual)** - Para controle do escritorio
2. **Formato Carne Leao** - Para importacao direta na Receita Federal

---

## Formato Oficial: Rendimentos (Receita Saude)

### Layout de 16 Campos

| # | Campo | Origem | Valor |
|---|-------|--------|-------|
| 1 | Data | `charges.payment_date` | DD/MM/AAAA |
| 2 | Codigo rendimento | Fixo | `R01.001.001` |
| 3 | Codigo ocupacao | Fixo | `255` (Psicologo) |
| 4 | Valor | `charges.amount` | `500,00` |
| 5 | Deducao | Vazio | `` |
| 6 | Historico | `charges.description` | Texto |
| 7 | Indicador recebido de | Fixo | `PF` |
| 8 | CPF pagador | `charges.payer_cpf` | 11 digitos |
| 9 | CPF beneficiario | `charges.patient_cpf` | 11 digitos |
| 10 | CPF nao informado | Vazio | `` |
| 11 | CNPJ | Vazio | `` |
| 12 | Indicador IRRF | Vazio | `` |
| 13 | Valor IRRF | Vazio | `` |
| 14 | Indicador recibo | Fixo | `S` |
| 15 | CPF profissional | `clients.cpf` | 11 digitos |
| 16 | Registro prof. | `clients.crp_number` | Opcional |

### Exemplo de Linha Gerada

```text
15/01/2026;R01.001.001;255;500,00;;Sessao de psicoterapia;PF;12345678901;12345678901;;;;;S;98765432109;CRP06/123456
```

---

## Formato Oficial: Pagamentos Dedutiveis (P10)

### Layout de 4 Campos (minimo)

| # | Campo | Origem | Valor |
|---|-------|--------|-------|
| 1 | Data | `expenses.payment_date` | DD/MM/AAAA |
| 2 | Codigo | `expense_categories.code` | `P10.01.00002` |
| 3 | Valor | `expenses.deductible_amount` | `1500,00` |
| 4 | Historico | `expenses.description` | Texto |

### Exemplo de Linha Gerada

```text
05/01/2026;P10.01.00002;1500,00;Aluguel consultorio Janeiro/2026
```

---

## Alteracoes no csv-utils.ts

### Novas Funcoes

```typescript
// Formata valor para Carne Leao (virgula como decimal)
export function formatValueCarneLeao(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

// Gera CSV com ponto e virgula (sem cabecalho)
export function generateCsvCarneLeao<T>(
  data: T[], 
  columns: CsvColumnCarneLeao<T>[]
): string {
  const BOM = '\uFEFF';
  const rows = data.map(item => 
    columns.map(col => col.render(item) || '').join(';')
  );
  return BOM + rows.join('\n');
}
```

---

## Alteracoes no useClientExport.ts

### Novos Dados Necessarios

O hook precisa retornar dados adicionais do cliente:

```typescript
export interface ClientExportData {
  charges: ChargeExportData[];
  expenses: ExpenseExportData[];
  client: {
    cpf: string;
    crpNumber: string | null;
  };
}
```

A query de charges permanece igual.
A query de expenses deve usar `deductible_amount` (valor ja calculado).

---

## Nova Interface de Exportacao

### Dialog Atualizado

O dialog de exportacao tera opcao de formato:

```text
+--------------------------------------------------+
|        Exportar Dados para Carne Leao            |
+--------------------------------------------------+
|                                                  |
|  Cliente: Maria Silva (CPF: 123.456.789-01)      |
|  CRP: CRP06/123456                               |
|                                                  |
|  Periodo: [Janeiro v] [2026 v]                   |
|                                                  |
|  Formato de exportacao:                          |
|  ( ) Formato interno (controle do escritorio)    |
|  (x) Formato Carne Leao (importacao RF)          |
|                                                  |
|  O que exportar?                                 |
|  [x] Rendimentos (Receita Saude) - 32 registros  |
|  [x] Despesas Dedutiveis (P10) - 8 registros     |
|                                                  |
|  [ Cancelar ]              [ Exportar CSV ]      |
+--------------------------------------------------+
```

---

## Validacoes a Implementar

### Antes da Exportacao

1. **CPF do cliente** - Deve ter 11 digitos validos
2. **CPF do paciente/pagador** - Todos devem ser validos
3. **Limite de linhas** - Maximo 1000 por arquivo
4. **Ano-calendario** - Datas devem ser do periodo selecionado

### Mensagens de Erro

- "CPF invalido encontrado. Verifique os cadastros antes de exportar."
- "Limite de 1000 linhas excedido. Exporte em periodos menores."

---

## Arquivos a Modificar

| Arquivo | Alteracoes |
|---------|------------|
| `src/lib/csv-utils.ts` | Adicionar funcoes para formato Carne Leao |
| `src/hooks/contador/useClientExport.ts` | Incluir dados do cliente (CPF, CRP) |
| `src/components/clientes/ExportClientDataDialog.tsx` | Adicionar opcao de formato e validacoes |
| `src/types/database.ts` | Adicionar `crp_number` ao tipo Client |

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/lib/carne-leao-export.ts` | Geradores de linhas para cada layout oficial |
| `src/lib/cpf-validator.ts` | Validacao completa de CPF |

---

## Funcao de Geracao: Rendimentos

```typescript
// src/lib/carne-leao-export.ts

interface RendimentoData {
  dataRecebimento: string;
  valor: number;
  historico: string;
  cpfPagador: string;
  cpfBeneficiario: string;
  cpfProfissional: string;
  registroProfissional: string | null;
}

export function gerarLinhaRendimento(data: RendimentoData): string {
  const campos = [
    formatDateBR(data.dataRecebimento),      // 1
    'R01.001.001',                            // 2
    '255',                                    // 3
    formatValueCarneLeao(data.valor),         // 4
    '',                                       // 5
    data.historico,                           // 6
    'PF',                                     // 7
    cleanCpf(data.cpfPagador),                // 8
    cleanCpf(data.cpfBeneficiario),           // 9
    '',                                       // 10
    '',                                       // 11
    '',                                       // 12
    '',                                       // 13
    'S',                                      // 14
    cleanCpf(data.cpfProfissional),           // 15
    data.registroProfissional || ''           // 16
  ];
  return campos.join(';');
}
```

---

## Funcao de Geracao: Pagamentos

```typescript
interface PagamentoData {
  dataPagamento: string;
  codigoDespesa: string;
  valor: number;
  historico: string | null;
}

export function gerarLinhaPagamento(data: PagamentoData): string {
  const campos = [
    formatDateBR(data.dataPagamento),
    data.codigoDespesa,
    formatValueCarneLeao(data.valor),
    data.historico || ''
  ];
  return campos.join(';');
}
```

---

## Fluxo de Exportacao Carne Leao

```text
1. Usuario seleciona cliente e periodo
     |
     v
2. Sistema busca charges (status=paid) e expenses do periodo
     |
     v
3. Sistema busca dados do cliente (CPF, CRP)
     |
     v
4. Validacao: CPFs validos? Limite de linhas?
     |
     +--> Erro: Exibe mensagem e bloqueia exportacao
     |
     v
5. Gera arquivo de Rendimentos (se selecionado)
   - Nome: rendimentos_[codigo]_[mesano].csv
   - Layout: 16 campos, separador ;
     |
     v
6. Gera arquivo de Pagamentos (se selecionado)
   - Nome: pagamentos_[codigo]_[mesano].csv
   - Layout: 4 campos, separador ;
     |
     v
7. Download dos arquivos + toast de sucesso
```

---

## Nomenclatura dos Arquivos

| Tipo | Formato Interno | Formato Carne Leao |
|------|-----------------|-------------------|
| Receitas | `receitas_ABC_janeiro_2026.csv` | `rendimentos_ABC_202601.csv` |
| Despesas | `despesas_ABC_janeiro_2026.csv` | `pagamentos_ABC_202601.csv` |

---

## Codigos P10 - Verificacao

Os codigos ja cadastrados no sistema:

| Codigo | Nome | Status |
|--------|------|--------|
| P10.01.00001 | Agua | OK |
| P10.01.00002 | Aluguel | OK |
| P10.01.00003 | Condominio | OK |
| P10.01.00004 | CRP - Conselho de classe | OK |
| P10.01.00007 | Energia | OK |
| P10.01.00008 | Gas | OK |
| P10.01.00009 | IPTU | OK |
| P10.01.00010 | ISS | OK |
| P10.01.00011 | Material de limpeza | OK |
| P10.01.00012 | Material de escritorio | OK |
| P10.01.00013 | Remuneracao paga a terceiros | OK |
| P10.01.00014 | Telefone/celular do consultorio | OK |

Todos os codigos estao alinhados com o manual.

---

## Despesas Residenciais - Calculo Importante

O manual nao menciona, mas no sistema atual temos um calculo:
- Despesas residenciais: `deductible_amount` = 20% do `amount`
- Despesas nao-residenciais: `deductible_amount` = 100% do `amount`

Para exportacao no Carne Leao, usamos sempre `deductible_amount`.

---

## Testes Recomendados

1. Exportar rendimentos e verificar todos os 16 campos
2. Exportar pagamentos e verificar formato
3. Testar CPF invalido (deve bloquear exportacao)
4. Testar com mais de 1000 lancamentos (deve alertar)
5. Importar arquivo gerado no Carne Leao Web (ambiente real)
6. Verificar que caracteres especiais nao quebram o CSV

---

## Consideracoes Finais

### Campos que Dependem do Cadastro

Para a exportacao funcionar corretamente:
- Cliente deve ter CPF preenchido
- Cliente pode ter CRP preenchido (opcional mas recomendado)
- Cada charge deve ter `patient_cpf` e `payer_cpf` preenchidos

### Integração com Módulo Gestão

O módulo de Gestão Mensal já implementado será o ponto de entrada principal para exportação. A funcionalidade poderá ser acessada:
1. Pelo painel de detalhes do cliente (botão "Exportar CSV")
2. Pelo menu de ações na lista de clientes
