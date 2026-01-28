
# Plano do Modulo de Gestao Mensal (Controle de Processos)

## Resumo Executivo

Criar um modulo dedicado para controle de processos internos do contador, permitindo acompanhar o status de lancamentos, estatisticas de clientes e controle de exportacoes para o Carne Leao. O modulo tera uma visao geral consolidada com possibilidade de drill-down para cada cliente.

---

## Arquitetura da Solucao

### Posicionamento no Sistema

O novo modulo sera adicionado ao sidebar no grupo "Obrigacoes" como primeiro item, refletindo sua importancia no fluxo de trabalho:

```text
Obrigacoes
  > Gestao         <- NOVO (rota: /contador/gestao)
  > Calendario
  > Relatorios
  > Conferencia
  > Protocolos
```

### Estrutura de Dados

Para rastrear o status de exportacao manual, precisamos criar uma nova tabela:

```sql
CREATE TABLE public.client_monthly_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  
  -- Status de exportacao (marcacao manual)
  charges_exported_at timestamp with time zone,
  charges_exported_by uuid,
  expenses_exported_at timestamp with time zone,
  expenses_exported_by uuid,
  
  -- Observacoes do contador
  notes text,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(client_id, year, month)
);
```

---

## Interface do Usuario

### Visao Geral (Dashboard)

Pagina principal `/contador/gestao` com:

**1. Seletor de Periodo**
- Mes/Ano (igual ao Relatorios)

**2. KPIs Consolidados**
| KPI | Descricao |
|-----|-----------|
| Total Clientes Ativos | Numero de clientes com status=active |
| Faturamento Total | Soma de charges pagas no periodo |
| Total Lancamentos | Soma de receitas + despesas |
| Clientes Exportados | X de Y clientes ja exportados no mes |

**3. Ranking de Clientes**
Tabela ordenavel com colunas:
| Coluna | Descricao |
|--------|-----------|
| Cliente | Nome do cliente |
| Faturamento | Soma das receitas pagas |
| Receitas | Qtd de lancamentos de receitas |
| Despesas | Qtd de lancamentos de despesas |
| Aliquota Est. | Calculo baseado na faixa do IRPF mensal |
| Status Export. | Badges: Receitas / Despesas |
| Acoes | Marcar exportado, ver detalhes |

**4. Alerta de Pendencias**
- Clientes sem lancamentos no mes
- Clientes com exportacao pendente

---

### Detalhes do Cliente (Drawer/Panel)

Ao clicar em um cliente, abre um painel lateral com:

**1. Resumo Financeiro**
- Faturamento do mes
- Total de despesas
- Lucro liquido (receitas - despesas)
- Aliquota efetiva estimada

**2. Checklist de Exportacao**
- [ ] Receitas exportadas - Botao "Marcar como exportado"
- [ ] Despesas exportadas - Botao "Marcar como exportado"
- Historico: "Exportado em DD/MM/YYYY por Usuario"

**3. Estatisticas do Cliente**
- Grafico de evolucao mensal (ultimos 6 meses)
- Comparativo com media dos clientes

**4. Acoes Rapidas**
- Botao "Exportar CSV" (abre o dialog existente)
- Botao "Ver lancamentos" (link para receitas/despesas do cliente)

---

## Calculo de Aliquota Efetiva

Baseado na tabela progressiva mensal do IRPF 2024:

```typescript
const IRPF_TABLE = [
  { limit: 2259.20, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 169.44 },
  { limit: 3751.05, rate: 0.15, deduction: 381.44 },
  { limit: 4664.68, rate: 0.225, deduction: 662.77 },
  { limit: Infinity, rate: 0.275, deduction: 896.00 },
];

function calculateEffectiveRate(monthlyIncome: number): number {
  // Encontra a faixa
  const bracket = IRPF_TABLE.find(b => monthlyIncome <= b.limit);
  const tax = (monthlyIncome * bracket.rate) - bracket.deduction;
  return tax > 0 ? (tax / monthlyIncome) * 100 : 0;
}
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/contador/Gestao.tsx` | Pagina principal do modulo |
| `src/hooks/contador/useClientMonthlyStats.ts` | Hook para buscar estatisticas |
| `src/hooks/contador/useClientMonthlyStatus.ts` | Hook para status de exportacao |
| `src/components/gestao/ClientStatsTable.tsx` | Tabela de ranking de clientes |
| `src/components/gestao/ClientDetailPanel.tsx` | Painel lateral de detalhes |
| `src/components/gestao/ExportChecklistCard.tsx` | Card de checklist de exportacao |
| `src/components/gestao/GestaoKPIs.tsx` | Cards de KPIs |
| `src/lib/irpf-utils.ts` | Funcoes de calculo de aliquota |

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/contador/ContadorSidebar.tsx` | Adicionar link "Gestao" como primeiro item |
| `src/App.tsx` | Adicionar rota /contador/gestao |

---

## Migracoes de Banco de Dados

### 1. Tabela client_monthly_status

```sql
-- Tabela para rastrear status de exportacao por cliente/mes
CREATE TABLE public.client_monthly_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  charges_exported_at timestamp with time zone,
  charges_exported_by uuid,
  expenses_exported_at timestamp with time zone,
  expenses_exported_by uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(client_id, year, month)
);

-- RLS
ALTER TABLE public.client_monthly_status ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem gerenciar
CREATE POLICY "Admins can manage client monthly status"
  ON public.client_monthly_status FOR ALL
  USING (
    client_in_user_org(client_id, auth.uid()) 
    AND has_role(auth.uid(), 'admin')
  );

-- Trigger para updated_at
CREATE TRIGGER update_client_monthly_status_updated_at
  BEFORE UPDATE ON public.client_monthly_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Queries Principais

### Estatisticas Agregadas por Cliente

```typescript
// Busca receitas e despesas agregadas por cliente para um mes
const { data } = await supabase
  .from('clients')
  .select(`
    id,
    name,
    code,
    charges(amount, status, payment_date),
    expenses(amount, deductible_amount, payment_date)
  `)
  .eq('status', 'active');

// Processa no frontend para calcular:
// - Soma de charges com status=paid e payment_date no mes
// - Soma de expenses com payment_date no mes
// - Calculo de aliquota
```

### Status de Exportacao

```typescript
// Busca status de exportacao para o mes
const { data: exportStatus } = await supabase
  .from('client_monthly_status')
  .select('*')
  .eq('year', selectedYear)
  .eq('month', selectedMonth);
```

---

## Fluxo de Marcacao de Exportacao

```text
1. Contador clica em "Marcar como exportado" na linha do cliente
     |
     v
2. Dialog de confirmacao: "Confirma que as [receitas/despesas] de [Cliente] 
   foram importadas no Carne Leao?"
     |
     v
3. Sistema faz upsert em client_monthly_status:
   - charges_exported_at = now()
   - charges_exported_by = auth.uid()
     |
     v
4. Badge muda de "Pendente" para "Exportado" com tooltip mostrando data/usuario
```

---

## Mockup Visual

```text
+------------------------------------------------------------------+
| Gestao Mensal                               [Janeiro 2025 v]      |
+------------------------------------------------------------------+
|                                                                   |
| +------------+ +------------+ +------------+ +------------+       |
| | 45         | | R$ 127.500 | | 892        | | 38/45      |       |
| | Clientes   | | Faturamento| | Lancamentos| | Exportados |       |
| +------------+ +------------+ +------------+ +------------+       |
|                                                                   |
| +---------------------------------------------------------------+ |
| | Cliente      | Faturamento | Rec | Desp | Aliq. | Status Exp. | |
| |--------------|-------------|-----|------|-------|-------------| |
| | Maria Silva  | R$ 8.500    | 32  | 5    | 15,2% | [R] [D]     | |
| | Joao Santos  | R$ 6.200    | 24  | 8    | 12,1% | [R] [ ]     | |
| | Ana Costa    | R$ 4.100    | 18  | 3    |  7,5% | [ ] [ ]     | |
| | ...          |             |     |      |       |             | |
| +---------------------------------------------------------------+ |
|                                                                   |
| Legenda: [R] = Receitas exportadas  [D] = Despesas exportadas     |
+------------------------------------------------------------------+
```

---

## Consideracoes de Performance

1. **Agregacao no Backend**: Para evitar N+1 queries, considerar criar uma VIEW ou funcao no PostgreSQL que retorne dados ja agregados
2. **Cache**: Usar staleTime adequado no TanStack Query (dados mudam apenas quando ha novos lancamentos)
3. **Paginacao**: Implementar se numero de clientes for grande (>50)

---

## Testes Recomendados

1. Verificar calculo de aliquota para diferentes faixas de renda
2. Testar marcacao de exportacao e persistencia
3. Verificar filtro por periodo (mes/ano)
4. Testar ranking e ordenacao por diferentes colunas
5. Verificar que apenas admins podem acessar/modificar

---

## Proximas Evolucoes (Fase 2)

- Exportacao em lote (varios clientes de uma vez)
- Alertas automaticos por email para clientes sem lancamentos
- Integracao com layouts oficiais do Carne Leao
- Dashboard de evolucao anual
