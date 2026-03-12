

# Atualizar Seção de Planos da Landing Page

## Mudanças

### 1. Substituir dados dos planos
Trocar os 3 planos atuais pelos novos, com preços anuais e mensais:

| Plano | Anual | Mensal | Destaque |
|-------|-------|--------|----------|
| Básico | R$ 197 | R$ 217 | - |
| Completo | R$ 247 | R$ 287 | Mais Popular |
| Psi Regular | R$ 367 | Indisponível | - |

**Features:**
- **Básico:** App completo, Emissão do Receita Saúde, Lançamento das despesas no Carnê Leão, Emissão e envio do DARF, Suporte por e-mail
- **Completo:** Tudo do Básico + Emissão e envio da Guia da Previdência Social (INSS) mensal
- **Psi Regular:** Tudo do Completo + Declaração de Ajuste Anual do IRPF do ano seguinte, Atendimento via WhatsApp

### 2. Adicionar toggle Anual/Mensal
- Usar o componente `Switch` existente (ou botões toggle) acima dos cards
- Estado `billingPeriod` (`anual` | `mensal`)
- Default: `anual`
- Quando `mensal`: Psi Regular mostra "Indisponível" com botão desabilitado em vez do preço

### 3. Atualizar `priceId` placeholders
- `price_basico_yearly`, `price_basico_monthly`
- `price_completo_yearly`, `price_completo_monthly`
- `price_psi_regular_yearly` (sem mensal)

### Arquivo modificado
- `src/pages/LandingPage.tsx` — substituir array `plans`, adicionar state de billing period, atualizar renderização da seção de preços

