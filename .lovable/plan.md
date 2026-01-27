
# Atualizar Remetente de E-mails para noreply@declarapsi.com.br

## Resumo

Atualizar todas as Edge Functions que enviam e-mails para usar o novo dominio verificado `declarapsi.com.br` em vez do dominio de teste `onboarding@resend.dev`.

## Alteracoes Necessarias

Substituir o remetente em 4 arquivos:

| Arquivo | Funcao | De | Para |
|---------|--------|----|----|
| `process-email-queue/index.ts` | Fila de envio de documentos | `onboarding@resend.dev` | `noreply@declarapsi.com.br` |
| `send-document-notification/index.ts` | Notificacao de documento | `onboarding@resend.dev` | `noreply@declarapsi.com.br` |
| `send-due-reminders/index.ts` | Lembrete de vencimento | `onboarding@resend.dev` | `noreply@declarapsi.com.br` |
| `send-welcome-email/index.ts` | Boas-vindas ao cliente | `onboarding@resend.dev` | `noreply@declarapsi.com.br` |

## Codigo

Em cada arquivo, a linha:
```typescript
from: 'Declara Psi <onboarding@resend.dev>',
```

Sera alterada para:
```typescript
from: 'Declara Psi <noreply@declarapsi.com.br>',
```

## Beneficios

1. **Profissionalismo**: E-mails enviados do proprio dominio da empresa
2. **Entregabilidade**: Melhor reputacao de envio com dominio verificado
3. **Isolamento**: Separacao clara dos eventos de e-mail deste sistema no Resend
4. **Rastreabilidade**: Facilita identificar e-mails do Declara Psi no painel do Resend

## Observacao sobre Filtro de Eventos

Com o dominio dedicado, os eventos no Resend ficam naturalmente separados. Porem, o webhook ainda recebera eventos de outros sistemas da mesma conta. Se desejar filtro adicional, podemos implementar verificacao no webhook para ignorar eventos de outros dominios.
