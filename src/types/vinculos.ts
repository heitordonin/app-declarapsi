import { ClientObligation, Client, Obligation } from './database';

/**
 * Tipo forte para vínculos com suas relações
 * Usado em componentes que exibem vínculos com dados de cliente e obrigação
 */
export type VinculoWithRelations = ClientObligation & {
  client: Pick<Client, 'id' | 'code' | 'name' | 'status'>;
  obligation: Pick<Obligation, 'id' | 'name' | 'frequency'>;
};
