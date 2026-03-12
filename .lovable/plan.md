

# Reposicionar Hero e adicionar seção "Dor do Receita Saúde"

## 1. Atualizar o Hero — mensagem de simplicidade

Alterar o subtítulo (linha 169-170) para reforçar que o Declara Psi é simples, rápido e direto — não é mais um sistema complexo cheio de telas e informações confusas.

**Novo subtítulo:**
> "Chega de sistemas complexos e cheios de informação. O Declara Psi é simples, rápido e direto: automatiza seu carnê-leão, DARF e obrigações fiscais para você focar no que importa."

## 2. Nova seção "Receita Saúde sem caderninho" — logo após o Hero, antes dos Benefícios

Uma seção de alto impacto visual posicionada entre o Hero e os Benefícios, atacando a dor principal: copiar e colar CPF de pacientes em planilhas/caderninhos para emitir o Receita Saúde.

**Estrutura:** Layout lado a lado (texto + 3 mini pain-points com ícones de "antes vs depois"):

- **Título:** "Nunca mais copie CPF de caderninho para o Receita Saúde"
- **Subtítulo:** "Seus pacientes ficam cadastrados. Nós emitimos o Receita Saúde para você — sem planilha, sem erro, sem estresse."
- **3 cards comparativos (Antes → Depois):**
  1. Antes: "Caderninho com CPFs e valores" → Depois: "Pacientes cadastrados no app"
  2. Antes: "Copiar e colar no Receita Saúde" → Depois: "Emissão automática por nós"
  3. Antes: "Medo de errar dados fiscais" → Depois: "Tudo conferido pela nossa equipe"
- **CTA:** "Quero parar de sofrer com planilhas" → scroll para planos

### Detalhes técnicos

**Arquivo:** `src/pages/LandingPage.tsx`

- Atualizar texto do `<p>` no Hero (linha 169-170)
- Inserir nova `<section>` entre o Hero (linha 196) e a seção Benefícios (linha 198)
- Usar ícones do lucide-react existentes (ex: `ClipboardX`, `ClipboardCheck`, `NotebookPen`, `Zap`)
- Estilo consistente com o restante da página (cards com sombra, cores do tema)

