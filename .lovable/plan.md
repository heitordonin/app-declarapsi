
# Plano de Reorganizacao do Sidebar do Contador em Modulos

## Resumo Executivo

Reorganizar a navegacao do sidebar do contador em 3 modulos tematicos, seguindo o mesmo padrao ja implementado no `ClienteSidebar`, para simplificar a navegacao e agrupar funcionalidades relacionadas.

---

## Estrutura Proposta

### Modulo 1: Obrigacoes
Agrupa todas as funcionalidades relacionadas ao controle de obrigacoes fiscais.

| Item | Icone | Rota |
|------|-------|------|
| Calendario | CalendarDays | /contador/obrigacoes |
| Relatorios | PieChart | /contador/relatorios |
| Conferencia | FileText | /contador/conferencia |
| Protocolos | BarChart | /contador/protocolos |

### Modulo 2: Relacionamento
Agrupa funcionalidades de comunicacao e documentos com clientes.

| Item | Icone | Rota |
|------|-------|------|
| Documentos | FolderOpen | /contador/documentos |
| Comunicados | Mail | /contador/comunicados |

### Modulo 3: Configuracoes
Agrupa itens administrativos e de gestao.

| Item | Icone | Rota |
|------|-------|------|
| Configuracoes | Settings | /contador/configuracoes |
| E-mails | MailCheck | /contador/emails |
| Clientes | Users | /contador/clientes |

---

## Implementacao

### Alteracoes no ContadorSidebar.tsx

Substituir a lista plana `navItems` por uma estrutura de modulos similar ao `ClienteSidebar`:

```typescript
import { ClipboardList, Handshake, Cog } from 'lucide-react';

const sidebarModules = [
  {
    id: 'obrigacoes',
    title: 'Obrigações',
    icon: ClipboardList,
    items: [
      { icon: CalendarDays, label: 'Calendário', path: '/contador/obrigacoes' },
      { icon: PieChart, label: 'Relatórios', path: '/contador/relatorios' },
      { icon: FileText, label: 'Conferência', path: '/contador/conferencia' },
      { icon: BarChart, label: 'Protocolos', path: '/contador/protocolos' },
    ]
  },
  {
    id: 'relacionamento',
    title: 'Relacionamento',
    icon: Handshake,
    items: [
      { icon: FolderOpen, label: 'Documentos', path: '/contador/documentos' },
      { icon: Mail, label: 'Comunicados', path: '/contador/comunicados' },
    ]
  },
  {
    id: 'configuracoes',
    title: 'Configurações',
    icon: Cog,
    items: [
      { icon: Settings, label: 'Configurações', path: '/contador/configuracoes' },
      { icon: MailCheck, label: 'E-mails', path: '/contador/emails' },
      { icon: Users, label: 'Clientes', path: '/contador/clientes' },
    ]
  },
];
```

### Estrutura do Render

Atualizar o JSX para iterar sobre modulos:

```typescript
<SidebarContent>
  {sidebarModules.map((module) => (
    <SidebarGroup key={module.id}>
      <SidebarGroupLabel>
        <module.icon className="h-4 w-4 mr-2" />
        {!isCollapsed && module.title}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {module.items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link to={item.path} onClick={handleNavClick}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ))}
</SidebarContent>
```

---

## Icones Sugeridos para Modulos

| Modulo | Icone Lucide | Justificativa |
|--------|--------------|---------------|
| Obrigacoes | ClipboardList | Lista de tarefas/obrigacoes |
| Relacionamento | Handshake | Interacao com clientes |
| Configuracoes | Cog | Configuracoes do sistema |

---

## Arquivo a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/contador/ContadorSidebar.tsx` | Refatorar para usar estrutura de modulos |

---

## Comparativo Visual

```text
ANTES (lista plana):          DEPOIS (modulos):
-------------------------     -------------------------
Area do Contador              Obrigacoes
  Obrigacoes                    Calendario
  Relatorios                    Relatorios
  Conferencia                   Conferencia
  Protocolos                    Protocolos
  Documentos                  Relacionamento
  E-mails                       Documentos
  Configuracoes                 Comunicados
  Comunicados                 Configuracoes
  Clientes                      Configuracoes
                                E-mails
                                Clientes
-------------------------     -------------------------
```

---

## Testes Recomendados

1. Navegar entre todas as paginas do modulo contador
2. Verificar destaque visual do item ativo em cada modulo
3. Testar comportamento collapsed (sidebar recolhida)
4. Testar em mobile - fechar sidebar ao clicar em item
5. Verificar que icones dos modulos aparecem quando collapsed

---

## Impacto Esperado

- Navegacao mais intuitiva e organizada
- Reducao da carga cognitiva ao encontrar funcionalidades
- Consistencia visual entre areas de cliente e contador
- Agrupamento logico facilita onboarding de novos usuarios
