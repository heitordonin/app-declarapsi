
# Plano de Melhorias de Acessibilidade/Mobile

## Resumo Executivo

Este plano corrige 3 problemas de acessibilidade e usabilidade mobile identificados: estabilidade de formularios em Drawers com teclado virtual, z-index de DatePicker dentro de Drawers, e padronizacao de touch targets para botoes.

---

## Problema 9: Formularios em Drawer - Falta repositionInputs={false}

### Analise

A propriedade `repositionInputs={false}` desativa o reposicionamento automatico do Vaul quando o teclado virtual abre, evitando comportamentos indesejaveis como inputs desaparecendo ou Drawers saltando.

| Arquivo | shouldScaleBackground | repositionInputs | Status |
|---------|----------------------|------------------|--------|
| ResponsiveActionPanel.tsx | implícito (default) | `false` | OK |
| StandardDescriptionsDialog.tsx | `false` | `false` | OK |
| MarkPaymentAsPaidDialog.tsx | `false` | **FALTA** | CORRIGIR |
| ChargeFilters.tsx | **FALTA** | **FALTA** | CORRIGIR |
| ExpenseFilters.tsx | **FALTA** | **FALTA** | CORRIGIR |

### Solucao

Adicionar `repositionInputs={false}` em todos os Drawers que contem inputs.

### Codigo - MarkPaymentAsPaidDialog.tsx (linha 149)

```typescript
// ANTES
<Drawer 
  open={open} 
  onOpenChange={onOpenChange}
  shouldScaleBackground={false}
>

// DEPOIS
<Drawer 
  open={open} 
  onOpenChange={onOpenChange}
  shouldScaleBackground={false}
  repositionInputs={false}
>
```

### Codigo - ChargeFilters.tsx (linha 226)

```typescript
// ANTES
<Drawer open={open} onOpenChange={onOpenChange}>

// DEPOIS
<Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
```

### Codigo - ExpenseFilters.tsx (linha 263)

```typescript
// ANTES
<Drawer open={open} onOpenChange={onOpenChange}>

// DEPOIS
<Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
```

---

## Problema 10: DatePicker z-index dentro de Drawer

### Analise

Atualmente:
- `DrawerContent` usa `z-50`
- `PopoverContent` (usado pelo DatePicker) tambem usa `z-50`

Quando um DatePicker e aberto dentro de um Drawer, ambos tem o mesmo z-index, o que pode fazer o calendario ficar atras do Drawer em alguns navegadores/dispositivos.

### Solucao

Aumentar o z-index do PopoverContent para `z-[60]` para garantir que apareca acima dos Drawers.

### Codigo - popover.tsx (linhas 19-20)

```typescript
// ANTES
className={cn(
  "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none...",
  className,
)}

// DEPOIS
className={cn(
  "z-[60] w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none...",
  className,
)}
```

### Impacto

Esta alteracao afeta todos os Popovers do sistema, garantindo que:
- DatePickers funcionem dentro de Drawers
- Menus dropdown funcionem dentro de Sheets
- Qualquer Popover tenha prioridade visual sobre modais

---

## Problema 11: Botoes touch-friendly inconsistentes

### Analise

A regra mobile-first define touch targets minimos de 44x44px. Verificando o codigo:

| Componente | Altura Atual | Status |
|------------|--------------|--------|
| PaymentCard.tsx (Baixar/Confirmar) | `h-11` (44px) | OK |
| MarkPaymentAsPaidDialog.tsx (footer) | `h-11` (44px) | OK |
| ChargeFilters.tsx (Aplicar/Limpar) | default (40px) | CORRIGIR |
| ExpenseFilters.tsx (Aplicar/Limpar) | default (40px) | CORRIGIR |
| StandardDescriptionsDialog.tsx (icones) | `h-8 w-8` (32px) | CORRIGIR |

### Solucao

Padronizar botoes de acao primaria em contexto mobile para `h-11` (44px).

### Codigo - ChargeFilters.tsx (FilterActions)

```typescript
// ANTES
<Button variant="ghost" onClick={handleClear}>
  Limpar
</Button>
<Button onClick={handleApply}>
  Aplicar filtros
</Button>

// DEPOIS
<Button variant="ghost" onClick={handleClear} className="h-11">
  Limpar
</Button>
<Button onClick={handleApply} className="h-11">
  Aplicar filtros
</Button>
```

### Codigo - ExpenseFilters.tsx (FilterActions)

```typescript
// ANTES
<Button variant="ghost" onClick={handleClear}>
  Limpar
</Button>
<Button onClick={handleApply}>
  Aplicar filtros
</Button>

// DEPOIS
<Button variant="ghost" onClick={handleClear} className="h-11">
  Limpar
</Button>
<Button onClick={handleApply} className="h-11">
  Aplicar filtros
</Button>
```

### Codigo - StandardDescriptionsDialog.tsx (icones de acao)

Os botoes de editar/excluir nas linhas de descricao usam `h-8 w-8`. Em mobile, isso e muito pequeno para toque preciso. Aumentar para `h-10 w-10`:

```typescript
// ANTES
<Button
  size="icon"
  variant="ghost"
  className="h-8 w-8 shrink-0"
  ...
>

// DEPOIS
<Button
  size="icon"
  variant="ghost"
  className="h-10 w-10 shrink-0"
  ...
>
```

---

## Resumo de Alteracoes por Arquivo

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/ui/popover.tsx` | Aumentar z-index para z-[60] |
| `src/components/cliente/pagamentos/MarkPaymentAsPaidDialog.tsx` | Adicionar repositionInputs={false} |
| `src/components/cliente/receitas/ChargeFilters.tsx` | Adicionar repositionInputs={false}, h-11 nos botoes |
| `src/components/cliente/despesas/ExpenseFilters.tsx` | Adicionar repositionInputs={false}, h-11 nos botoes |
| `src/components/cliente/receitas/StandardDescriptionsDialog.tsx` | Aumentar botoes de acao para h-10 w-10 |

---

## Testes Recomendados

1. **Teste de teclado virtual**: Abrir MarkPaymentAsPaidDialog no mobile, focar no campo de data e verificar se o Drawer nao salta
2. **Teste de DatePicker em Drawer**: Abrir filtros de despesas no mobile e selecionar data - calendario deve aparecer acima do Drawer
3. **Teste de touch targets**: Verificar que botoes de acao sao facilmente tocaveis em dispositivos moveis
4. **Teste de regressao**: Verificar que Popovers em outras partes do app continuam funcionando (menus dropdown, selects)

---

## Impacto Esperado

- Formularios em Drawers nao "pulam" quando teclado virtual abre
- DatePickers sempre visiveis e clicaveis dentro de modais
- Melhor usabilidade em dispositivos touch com alvos maiores
- Reducao de toques acidentais e frustracoes do usuario

