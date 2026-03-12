
# Problema Identificado: Link para Protocolos Ausente no Menu

## Diagnóstico

A página `/contador/protocolos` existe e está corretamente registrada no roteamento (`App.tsx` linha 86), porém **não há link para ela no menu lateral** (`ContadorSidebar.tsx`).

O sidebar atual tem:
- Conferência ✓
- Protocolos ✗ (faltando)

## Solução

Adicionar o link para "Protocolos" no menu lateral, logo após "Conferência", dentro do módulo "Obrigações".

---

## Alteração Necessária

### Arquivo: `src/components/contador/ContadorSidebar.tsx`

**Localização:** Módulo "Obrigações" (linhas 36-45)

**Antes:**
```typescript
{
  id: 'obrigacoes',
  title: 'Obrigações',
  icon: ClipboardList,
  items: [
    { icon: BarChart, label: 'Gestão', path: '/contador/gestao' },
    { icon: CalendarDays, label: 'Calendário', path: '/contador/obrigacoes' },
    { icon: PieChart, label: 'Relatórios', path: '/contador/relatorios' },
    { icon: FileText, label: 'Conferência', path: '/contador/conferencia' },
  ]
}
```

**Depois:**
```typescript
{
  id: 'obrigacoes',
  title: 'Obrigações',
  icon: ClipboardList,
  items: [
    { icon: BarChart, label: 'Gestão', path: '/contador/gestao' },
    { icon: CalendarDays, label: 'Calendário', path: '/contador/obrigacoes' },
    { icon: PieChart, label: 'Relatórios', path: '/contador/relatorios' },
    { icon: FileText, label: 'Conferência', path: '/contador/conferencia' },
    { icon: Send, label: 'Protocolos', path: '/contador/protocolos' },
  ]
}
```

### Ícone a Adicionar

Importar o ícone `Send` do lucide-react (representa envio de documentos).

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/components/contador/ContadorSidebar.tsx` | Adicionar import do ícone `Send` e novo item de menu "Protocolos" |

---

## Resultado Esperado

Após a alteração, o menu lateral exibirá:

```
📊 Gestão
📅 Calendário
📈 Relatórios
📄 Conferência
✉️ Protocolos  ← NOVO
```

Isso permitirá acesso direto à página de Protocolos que lista todos os documentos enviados aos clientes.
