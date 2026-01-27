

# Plano: Criar Módulo de Documentos Permanentes no Painel do Contador

## Contexto

O módulo `/cliente/documentos` exibe "Documentos Permanentes" (Contrato Social, Alvará, etc.), mas:
- Usa dados mock (não há integração com o banco de dados)
- O contador não tem onde fazer upload desses documentos
- A tabela `documents` atual é específica para documentos de obrigações (com campos `obligation_id`, `competence`, `due_at`)

## Solucao Proposta

Criar uma **nova tabela `permanent_documents`** para documentos permanentes e adicionar o módulo de gerenciamento no painel do contador.

---

## Arquitetura

```text
+---------------------------+     +----------------------------+
|  Contador                 |     |  Cliente                   |
|  /contador/documentos     |     |  /cliente/documentos       |
+---------------------------+     +----------------------------+
|  - Selecionar cliente     |     |  - Visualizar documentos   |
|  - Fazer upload           |     |  - Baixar documentos       |
|  - Editar/Excluir         |     |  (somente leitura)         |
+---------------------------+     +----------------------------+
            |                               |
            v                               v
      +------------------------------------------+
      |      Tabela: permanent_documents         |
      |------------------------------------------|
      |  id, org_id, client_id, name,            |
      |  file_path, file_name, uploaded_by,      |
      |  uploaded_at, viewed_at                  |
      +------------------------------------------+
```

---

## Alteracoes no Banco de Dados

### 1. Nova Tabela `permanent_documents`

```sql
CREATE TABLE permanent_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- Nome amigável (ex: "Contrato Social")
  file_path TEXT NOT NULL,               -- Caminho no storage
  file_name TEXT NOT NULL,               -- Nome original do arquivo
  uploaded_by UUID NOT NULL,             -- Quem fez upload
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_at TIMESTAMPTZ,                 -- Quando o cliente visualizou
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE permanent_documents ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar todos os documentos da org
CREATE POLICY "Admins can manage permanent documents"
ON permanent_documents FOR ALL
USING (org_id = get_user_org(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- Clientes podem visualizar seus documentos
CREATE POLICY "Clients can view their permanent documents"
ON permanent_documents FOR SELECT
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Clientes podem atualizar viewed_at
CREATE POLICY "Clients can mark permanent documents as viewed"
ON permanent_documents FOR UPDATE
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
```

### 2. Policies de Storage

Adicionar policies no bucket `documents` para permitir upload de documentos permanentes na pasta `permanent/`:

```sql
CREATE POLICY "Admins can upload permanent documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'permanent' AND
  has_role(auth.uid(), 'admin')
);
```

---

## Arquivos a Criar/Modificar

### Frontend - Painel do Contador

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/contador/DocumentosPermanentes.tsx` | Criar | Página principal do módulo |
| `src/components/contador/documentos/DocumentosTable.tsx` | Criar | Tabela de documentos por cliente |
| `src/components/contador/documentos/UploadDocumentDialog.tsx` | Criar | Dialog para upload de documento |
| `src/components/contador/documentos/EditDocumentDialog.tsx` | Criar | Dialog para editar nome do documento |
| `src/hooks/contador/usePermanentDocuments.ts` | Criar | Hook para gerenciar documentos permanentes |
| `src/components/contador/ContadorSidebar.tsx` | Modificar | Adicionar item "Documentos" no menu |
| `src/App.tsx` | Modificar | Adicionar rota `/contador/documentos` |

### Frontend - Painel do Cliente

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/hooks/cliente/useDocumentsData.ts` | Modificar | Integrar com banco real (remover mock) |
| `src/components/cliente/documentos/DocumentActionsMenu.tsx` | Modificar | Implementar download/visualização real |
| `src/pages/cliente/Documentos.tsx` | Modificar | Adicionar loading state |

---

## Interface do Contador

### Tela Principal (`/contador/documentos`)

```text
+-------------------------------------------------------+
|  Documentos Permanentes                    [+ Novo]   |
+-------------------------------------------------------+
|  Cliente: [Select Cliente v]                          |
+-------------------------------------------------------+
|  DOCUMENTO              ENVIADO EM    VISUALIZADO    |
|  -----------------------------------------------     |
|  Contrato Social        15/01/2025    Sim            |
|  Alvará de Funcionamento 10/02/2025   Não            |
|  CNPJ - Cartão          20/03/2025    Sim            |
+-------------------------------------------------------+
```

### Dialog de Upload

```text
+----------------------------------------+
|  Novo Documento Permanente             |
+----------------------------------------+
|  Cliente: [Select Cliente]             |
|  Nome do documento: [                ] |
|  Arquivo: [Selecionar arquivo...]      |
|                                        |
|  [Cancelar]            [Fazer Upload]  |
+----------------------------------------+
```

---

## Fluxo de Uso

1. **Contador acessa** `/contador/documentos`
2. **Seleciona cliente** no dropdown
3. **Clica em "+ Novo"** para abrir dialog de upload
4. **Preenche nome** e **seleciona arquivo**
5. **Arquivo é salvo** no storage em `documents/permanent/{org_id}/{client_id}/{arquivo}`
6. **Registro criado** na tabela `permanent_documents`
7. **Cliente visualiza** em `/cliente/documentos`
8. **Ao baixar**, campo `viewed_at` é atualizado

---

## Detalhes Tecnicos

### Hook `usePermanentDocuments`

```typescript
// Buscar documentos por cliente
const { data, isLoading } = useQuery({
  queryKey: ['permanent-documents', clientId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('permanent_documents')
      .select('*')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  enabled: !!clientId
});

// Upload de documento
const uploadMutation = useMutation({
  mutationFn: async ({ clientId, name, file }) => {
    // 1. Upload para storage
    const path = `permanent/${orgId}/${clientId}/${file.name}`;
    await supabase.storage.from('documents').upload(path, file);
    
    // 2. Criar registro
    await supabase.from('permanent_documents').insert({
      org_id: orgId,
      client_id: clientId,
      name,
      file_path: path,
      file_name: file.name,
      uploaded_by: userId
    });
  }
});
```

### Integracao no Cliente

```typescript
// useDocumentsData.ts - Versão real
export function useDocumentsData() {
  const { data: client } = useClientId();
  
  const { data, isLoading } = useQuery({
    queryKey: ['permanent-documents', client?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permanent_documents')
        .select('*')
        .eq('client_id', client.id)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!client?.id
  });
  
  return { documents: data ?? [], isLoading };
}
```

---

## Seguranca

| Aspecto | Implementacao |
|---------|---------------|
| Isolamento por Org | RLS policy com `org_id = get_user_org(auth.uid())` |
| Acesso Cliente | Apenas visualização dos próprios documentos |
| Acesso Admin | CRUD completo para documentos da org |
| Storage | Policies específicas para pasta `permanent/` |

---

## Resultado Esperado

**Antes:**
- Cliente vê dados mock em `/cliente/documentos`
- Contador não tem como enviar documentos permanentes
- Documentos permanentes não são persistidos

**Depois:**
- Contador acessa `/contador/documentos` e faz upload de documentos
- Cliente visualiza e baixa os documentos reais
- Notificação visual quando há novos documentos (badge no menu)
- Histórico de visualização mantido

