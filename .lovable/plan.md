

# Landing Page — Declara Psi

## Objetivo
Criar uma landing page profissional em `/` (rota raiz para visitantes não autenticados), focada em conversão e SEO, com seção de planos preparada para integração futura com Stripe.

## Estrutura da Página

### Seções
1. **Navbar** — Logo + links âncora (Benefícios, Como Funciona, Planos, FAQ) + botão "Entrar" e "Começar Agora"
2. **Hero** — Headline forte, subtítulo, CTA principal, imagem/ilustração abstrata
3. **Logos / Prova Social** — "Mais de X psicólogos confiam na Declara Psi"
4. **Benefícios** — 4-6 cards com ícones (Lucide): gestão financeira, obrigações fiscais, relatórios, segurança, etc.
5. **Como Funciona** — 3 passos numerados com ícones
6. **Planos e Preços** — 3 cards (Essencial R$97/mês, Profissional R$197/mês, Consultório R$347/mês) com lista de features e CTA. Cada card terá um `priceId` placeholder para Stripe
7. **Depoimentos** — 3 cards com foto placeholder, nome fictício, especialidade
8. **FAQ** — Accordion com 5-6 perguntas comuns
9. **CTA Final** — Seção de conversão com botão
10. **Footer** — Links, contato, redes sociais

### SEO
- Atualizar `index.html` com meta tags otimizadas (title, description, og:title, og:description, og:image)
- Semantic HTML (h1, h2, sections, nav, footer)
- `robots.txt` já está configurado

### Preparação para Stripe
- Cada plano terá um objeto com `name`, `price`, `priceId` (placeholder string como `price_essencial_monthly`), `features[]`
- O botão de cada plano chamará uma função `handleSelectPlan(priceId)` que por enquanto redireciona para `/auth`
- Quando Stripe for integrado, basta trocar os `priceId` pelos IDs reais e implementar o checkout

## Arquivos

### Novos
- `src/pages/LandingPage.tsx` — Página completa com todas as seções

### Modificados
- `src/App.tsx` — Alterar `RootRedirect` para mostrar a landing page quando não autenticado (em vez de redirecionar para `/auth`)
- `index.html` — Meta tags SEO atualizadas

## Cores e Branding
- Primary: #002471 (navy blue, já configurado como `--primary`)
- Accent: #03f6f9 (cyan, usado como destaque)
- Logo existente: `src/assets/logo-declara-psi.png`

## Planos (valores fictícios)

| Plano | Preço | Destaques |
|-------|-------|-----------|
| Essencial | R$ 97/mês | Até 20 pacientes, gestão financeira básica, relatórios mensais |
| Profissional | R$ 197/mês | Até 80 pacientes, carnê-leão automático, suporte prioritário |
| Consultório | R$ 347/mês | Pacientes ilimitados, multi-profissional, API de integração |

