
# Correção do Reenvio de Protocolo

## Problema Identificado

O botão de reenviar protocolo em `/contador/protocolos` **NÃO envia e-mail**. Ele apenas atualiza o status do documento para "sent", mas não adiciona o documento na fila de e-mails (`email_queue`).

## Fluxo Atual (Incorreto)

```text
Botão Reenviar → Atualiza documents.delivery_state = 'sent' → FIM
                 (Nenhum e-mail é enviado!)
```

## Fluxo Correto (Como Deveria Ser)

```text
Botão Reenviar → Insere na email_queue → Cron processa → E-mail enviado → Webhook atualiza status
```

## Alteracoes Necessarias

### Arquivo: `src/components/protocolos/DocumentosTable.tsx`

Modificar a `resendMutation` para:

1. Atualizar o `delivery_state` do documento para `'sent'`
2. Resetar o campo `viewed_at` para `null` (indicando novo envio)
3. **Inserir um novo registro na tabela `email_queue`** com status `'pending'`

### Codigo Corrigido

A mutacao passara a:

```typescript
const resendMutation = useMutation({
  mutationFn: async (documentId: string) => {
    // 1. Atualizar documento
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        delivery_state: "sent",
        delivered_at: new Date().toISOString(),
        viewed_at: null, // Resetar visualizacao
      })
      .eq("id", documentId);

    if (updateError) throw updateError;

    // 2. Adicionar na fila de e-mails
    const { error: queueError } = await supabase
      .from("email_queue")
      .insert({
        document_id: documentId,
        status: "pending",
      });

    if (queueError) throw queueError;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["documents"] });
    queryClient.invalidateQueries({ queryKey: ["email-queue"] });
    toast({
      title: "Sucesso",
      description: "Documento adicionado a fila de reenvio.",
    });
  },
  // ... error handling
});
```

## Comportamento Esperado Apos Correcao

1. Usuario clica em "Reenviar"
2. Documento tem status atualizado para "Enviado"
3. Novo registro criado em `email_queue` com status "pending"
4. Cron job (a cada minuto) processa a fila
5. E-mail e enviado via Resend
6. Webhook atualiza status para "Entregue" ou "Aberto"

## Observacao Sobre RLS

A tabela `email_queue` ja possui policy que permite admins visualizar e uma policy "System can manage" que permite INSERT. A operacao sera executada pelo usuario autenticado com role admin, portanto funcionara corretamente.
