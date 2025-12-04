export interface Communication {
  id: string;
  subject: string;
  message: string;
  sentAt: string;
  viewedAt: string | null;
}

const mockCommunications: Communication[] = [
  {
    id: '1',
    subject: 'Atualização de Documentos Fiscais',
    message: '<p>Prezado(a) cliente,</p><p>Informamos que os documentos fiscais referentes ao mês de novembro já estão disponíveis para consulta.</p><p>Por favor, acesse a área de documentos para visualizá-los.</p><p>Atenciosamente,<br/>Equipe Contábil</p>',
    sentAt: '2025-12-01T10:30:00',
    viewedAt: '2025-12-01T14:00:00',
  },
  {
    id: '2',
    subject: 'Lembrete: Prazo de Entrega IR',
    message: '<p>Prezado(a) cliente,</p><p>Gostaríamos de lembrar que o prazo para entrega da documentação do Imposto de Renda está se aproximando.</p><p>Solicitamos que envie os documentos necessários até o dia 15 deste mês.</p><p>Atenciosamente,<br/>Equipe Contábil</p>',
    sentAt: '2025-11-28T09:00:00',
    viewedAt: null,
  },
  {
    id: '3',
    subject: 'Novos Serviços Disponíveis',
    message: '<p>Prezado(a) cliente,</p><p>Temos o prazer de informar que novos serviços estão disponíveis em nossa plataforma:</p><ul><li>Consultoria tributária online</li><li>Análise de crédito</li><li>Planejamento financeiro</li></ul><p>Entre em contato para mais informações.</p><p>Atenciosamente,<br/>Equipe Contábil</p>',
    sentAt: '2025-11-20T15:45:00',
    viewedAt: '2025-11-21T08:30:00',
  },
];

export function useCommunicationsData() {
  return {
    communications: mockCommunications,
    isLoading: false,
  };
}
