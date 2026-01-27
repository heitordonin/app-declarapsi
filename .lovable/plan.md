
# Sistema de Logs de E-mail para o Painel do Contador

## Visao Geral

Implementar uma nova pagina dedicada no painel do contador para monitoramento completo do sistema de e-mails, incluindo estatisticas, logs de eventos e gestao da fila de envio.

## Nova Rota e Navegacao

Adicionar nova pagina `/contador/emails` acessivel pelo menu lateral do contador com icone de MailCheck.

## Estrutura da Pagina

A pagina sera dividida em 3 abas (Tabs):

### Aba 1: Dashboard de Estatisticas

**KPIs em Cards:**
- Total de E-mails Enviados (periodo selecionavel)
- Taxa de Entrega (delivered + opened / total enviados)
- Taxa de Abertura (opened / delivered)
- Taxa de Falha (bounced + failed / total)

**Graficos:**
- Donut Chart: Distribuicao por status (sent, delivered, opened, bounced, failed)
- Bar Chart: Evolucao diaria/semanal dos envios e status

**Filtros:**
- Seletor de periodo (ultimos 7 dias, 30 dias, mes especifico)
- Filtro por cliente

### Aba 2: Log de Eventos

Tabela com todos os eventos registrados na tabela `email_events`:

**Colunas:**
- Data/Hora do Evento
- Tipo de Evento (delivered, opened, bounced, clicked, spam)
- Destinatario (email)
- Documento Relacionado (se disponivel)
- Cliente
- Metadados (expansivel)

**Funcionalidades:**
- Paginacao
- Filtro por tipo de evento
- Filtro por destinatario
- Busca por periodo

### Aba 3: Fila de E-mails

Tabela de monitoramento da tabela `email_queue`:

**Colunas:**
- Status (pending, processing, sent, failed)
- Documento
- Cliente
- Tentativas (X de Y)
- Proxima Tentativa
- Erro (se houver)
- Criado em

**Acoes:**
- Reprocessar manualmente (botao para itens failed)
- Cancelar envio (para itens pending)

**Badge de Alerta:**
- Indicador visual quando houver itens na fila com status "failed"

## Arquivos a Criar/Modificar

### Novos Arquivos:
1. `src/pages/contador/Emails.tsx` - Pagina principal com Tabs
2. `src/components/emails/EmailStatsTab.tsx` - Dashboard de estatisticas
3. `src/components/emails/EmailEventsTab.tsx` - Tabela de eventos
4. `src/components/emails/EmailQueueTab.tsx` - Gestao da fila
5. `src/components/emails/EmailDeliveryChart.tsx` - Grafico donut de status
6. `src/components/emails/EmailEvolutionChart.tsx` - Grafico de evolucao temporal
7. `src/hooks/contador/useEmailStats.ts` - Hook para estatisticas
8. `src/hooks/contador/useEmailEvents.ts` - Hook para eventos
9. `src/hooks/contador/useEmailQueue.ts` - Hook para fila

### Modificar:
1. `src/components/contador/ContadorSidebar.tsx` - Adicionar item "E-mails" no menu
2. `src/App.tsx` - Adicionar rota `/contador/emails`

## Detalhes Tecnicos

### Queries de Estatisticas

```sql
-- Total por delivery_state (documentos)
SELECT delivery_state, COUNT(*) 
FROM documents 
WHERE deleted_at IS NULL 
GROUP BY delivery_state;

-- Eventos por tipo
SELECT event_type, COUNT(*) 
FROM email_events 
WHERE received_at >= [data_inicio]
GROUP BY event_type;

-- Taxa de abertura por periodo
SELECT 
  DATE(received_at) as data,
  event_type,
  COUNT(*) as total
FROM email_events
WHERE received_at >= [data_inicio]
GROUP BY DATE(received_at), event_type
ORDER BY data;
```

### Componentes Reutilizados

- `KPICard` de `/components/relatorios/` para exibir metricas
- `Table` components do shadcn/ui para tabelas
- `Tabs` do shadcn/ui para navegacao entre abas
- `PieChart` e `BarChart` do recharts para graficos
- `Badge` para status visuais

### Paleta de Cores para Status

```javascript
const emailStatusColors = {
  sent: '#3b82f6',      // blue-500
  delivered: '#06b6d4', // cyan-500  
  opened: '#22c55e',    // green-500
  bounced: '#ef4444',   // red-500
  failed: '#dc2626',    // red-600
  clicked: '#8b5cf6',   // violet-500
  spam: '#f97316',      // orange-500
};
```

### Seguranca (RLS)

As tabelas `email_queue` e `email_events` ja possuem policies que permitem SELECT apenas para admins:
- `email_queue`: "Admins can view email queue"
- `email_events`: "Admins can view email events"

Nao sera necessario criar novas policies.

## Fluxo de Implementacao

1. Criar hooks de dados (useEmailStats, useEmailEvents, useEmailQueue)
2. Criar componentes de graficos (EmailDeliveryChart, EmailEvolutionChart)
3. Criar componentes de tabs (EmailStatsTab, EmailEventsTab, EmailQueueTab)
4. Criar pagina principal (Emails.tsx)
5. Atualizar sidebar e rotas
6. Testar integracao com dados reais

## Observacoes

- A paginacao sera implementada client-side inicialmente, com opcao de cursor-based se necessario
- Os graficos seguem o mesmo padrao visual da pagina de Relatorios existente
- Responsividade mobile-first sera aplicada em todas as tabelas e graficos
