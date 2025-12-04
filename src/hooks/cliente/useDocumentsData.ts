export interface Document {
  id: string;
  name: string;
  createdAt: string;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Contrato Social',
    createdAt: '2025-01-15',
  },
  {
    id: '2',
    name: 'Alvará de Funcionamento',
    createdAt: '2025-02-10',
  },
  {
    id: '3',
    name: 'Inscrição Municipal',
    createdAt: '2025-03-05',
  },
  {
    id: '4',
    name: 'CNPJ - Cartão',
    createdAt: '2025-03-20',
  },
  {
    id: '5',
    name: 'Certificado Digital',
    createdAt: '2025-04-12',
  },
];

export function useDocumentsData() {
  return {
    documents: mockDocuments,
    isLoading: false,
  };
}
