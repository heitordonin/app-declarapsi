
# Remover Metrica de Open Rate do Dashboard de E-mails

## Resumo

Remover todas as referencias a "Taxa de Abertura" (Open Rate) e eventos "opened" do dashboard de e-mails, ja que o Open Tracking esta desabilitado no Resend e os dados seriam sempre zero.

## Arquivos a Modificar

### 1. src/components/emails/EmailStatsTab.tsx

**Remover:**
- Import do icone `Eye` (linha 8)
- KPI Card de "Taxa de Abertura" (linhas 52-57)

**Ajustar:**
- Grid de KPIs de 4 para 3 colunas: `lg:grid-cols-4` para `lg:grid-cols-3`

### 2. src/hooks/contador/useEmailStats.ts

**Remover:**
- Propriedade `openRate` da interface `EmailStats` (linha 8)
- Cor `opened` do objeto `EMAIL_STATUS_COLORS` (linha 28)
- Campo `opened` do objeto `dailyData` (linha 60)
- Variavel `opened` e calculo de `openRate` (linhas 69, 74)
- Propriedade `openRate` do retorno (linha 99)

**Ajustar:**
- Calculo de `deliveryRate` para usar apenas `delivered` (remover `+ opened`)

### 3. src/components/emails/EmailEvolutionChart.tsx

**Remover:**
- Campo `opened` da interface de props (linha 10)
- Cor `opened` do objeto `CHART_COLORS` (linha 19)
- Label `opened` do objeto `STATUS_LABELS` (linha 27)
- Barra `opened` do grafico (linha 63)

### 4. src/components/emails/EmailDeliveryChart.tsx

**Remover:**
- Label `opened` do objeto `STATUS_LABELS` (linha 13)

O grafico de pizza (EmailDeliveryChart) automaticamente nao mostrara "opened" pois os dados vem do backend e nao havera eventos desse tipo.

## Resultado Visual

Dashboard passara de 4 KPIs para 3:
1. Total Enviados
2. Taxa de Entrega
3. Taxa de Falha

O grafico de evolucao diaria mostrara apenas: Enviado, Entregue, Bounced e Falhou.
