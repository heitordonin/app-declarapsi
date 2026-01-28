/**
 * Geradores de linhas para exportação no formato oficial do Carnê Leão Web
 * Layouts definidos pela Receita Federal do Brasil
 * 
 * Referência: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/carne-leao/manual
 */

import { formatDateBR, cleanCpf } from './csv-utils';

// ============================================
// CONSTANTES DO LAYOUT OFICIAL
// ============================================

/** Código de rendimento para trabalho não assalariado */
export const CODIGO_RENDIMENTO = 'R01.001.001';

/** Código de ocupação para Psicólogo */
export const CODIGO_OCUPACAO = '255';

/** Indicador de recebimento de Pessoa Física */
export const INDICADOR_PF = 'PF';

/** Indicador de emissão de recibo (Receita Saúde) */
export const INDICADOR_RECIBO = 'S';

/** Separador de campos do Carnê Leão */
export const SEPARADOR_CARNE_LEAO = ';';

/** Limite de linhas por arquivo */
export const LIMITE_LINHAS = 1000;

// ============================================
// FORMATAÇÃO DE VALORES
// ============================================

/**
 * Formata valor monetário para o padrão Carnê Leão
 * Usa vírgula como separador decimal, sem pontos de milhar
 * Exemplo: 1500.50 → "1500,50"
 */
export function formatValueCarneLeao(value: number | null): string {
  if (value === null || value === undefined) return '0,00';
  return value.toFixed(2).replace('.', ',');
}

// ============================================
// TIPOS DE DADOS
// ============================================

export interface RendimentoData {
  /** Data do recebimento (formato YYYY-MM-DD) */
  dataRecebimento: string;
  /** Valor recebido */
  valor: number;
  /** Descrição do serviço */
  historico: string;
  /** CPF de quem pagou */
  cpfPagador: string;
  /** CPF de quem recebeu o serviço (paciente) */
  cpfBeneficiario: string;
  /** CPF do profissional (psicólogo) */
  cpfProfissional: string;
  /** Registro profissional (CRP) - opcional */
  registroProfissional: string | null;
}

export interface PagamentoData {
  /** Data do pagamento (formato YYYY-MM-DD) */
  dataPagamento: string;
  /** Código da despesa (P10.XX.XXXXX) */
  codigoDespesa: string;
  /** Valor dedutível */
  valor: number;
  /** Descrição da despesa */
  historico: string | null;
}

// ============================================
// GERADORES DE LINHAS
// ============================================

/**
 * Gera uma linha de Rendimento (Receita Saúde) no formato oficial
 * Layout de 16 campos separados por ponto e vírgula
 * 
 * Campos:
 * 1. Data do lançamento (DD/MM/AAAA)
 * 2. Código do rendimento (R01.001.001)
 * 3. Código da ocupação (255)
 * 4. Valor recebido
 * 5. Valor da dedução (vazio)
 * 6. Histórico
 * 7. Indicador "recebido de" (PF)
 * 8. CPF do pagador
 * 9. CPF do beneficiário
 * 10. Indicador CPF não informado (vazio)
 * 11. CNPJ (vazio)
 * 12. Indicador de IRRF (vazio)
 * 13. Valor IRRF (vazio)
 * 14. Indicador de recibo (S)
 * 15. CPF do profissional
 * 16. Registro profissional
 */
export function gerarLinhaRendimento(data: RendimentoData): string {
  const campos = [
    formatDateBR(data.dataRecebimento),           // 1 - Data
    CODIGO_RENDIMENTO,                             // 2 - Código rendimento
    CODIGO_OCUPACAO,                               // 3 - Código ocupação
    formatValueCarneLeao(data.valor),              // 4 - Valor
    '',                                            // 5 - Dedução (vazio)
    escapeSemicolon(data.historico),               // 6 - Histórico
    INDICADOR_PF,                                  // 7 - Recebido de PF
    cleanCpf(data.cpfPagador),                     // 8 - CPF pagador
    cleanCpf(data.cpfBeneficiario),                // 9 - CPF beneficiário
    '',                                            // 10 - CPF não informado (vazio)
    '',                                            // 11 - CNPJ (vazio)
    '',                                            // 12 - Indicador IRRF (vazio)
    '',                                            // 13 - Valor IRRF (vazio)
    INDICADOR_RECIBO,                              // 14 - Indicador recibo
    cleanCpf(data.cpfProfissional),                // 15 - CPF profissional
    data.registroProfissional || ''                // 16 - Registro profissional
  ];
  
  return campos.join(SEPARADOR_CARNE_LEAO);
}

/**
 * Gera uma linha de Pagamento Dedutível (P10) no formato oficial
 * Layout de 4 campos (mínimo) separados por ponto e vírgula
 * 
 * Campos:
 * 1. Data do pagamento (DD/MM/AAAA)
 * 2. Código do pagamento (P10.XX.XXXXX)
 * 3. Valor pago
 * 4. Histórico
 */
export function gerarLinhaPagamento(data: PagamentoData): string {
  const campos = [
    formatDateBR(data.dataPagamento),              // 1 - Data
    data.codigoDespesa,                            // 2 - Código
    formatValueCarneLeao(data.valor),              // 3 - Valor
    escapeSemicolon(data.historico || '')          // 4 - Histórico
  ];
  
  return campos.join(SEPARADOR_CARNE_LEAO);
}

// ============================================
// GERAÇÃO DE ARQUIVO COMPLETO
// ============================================

/**
 * Gera o conteúdo completo do arquivo de Rendimentos
 * Inclui BOM para UTF-8, sem cabeçalho
 */
export function gerarArquivoRendimentos(rendimentos: RendimentoData[]): string {
  const BOM = '\uFEFF';
  const linhas = rendimentos.map(r => gerarLinhaRendimento(r));
  return BOM + linhas.join('\n');
}

/**
 * Gera o conteúdo completo do arquivo de Pagamentos
 * Inclui BOM para UTF-8, sem cabeçalho
 */
export function gerarArquivoPagamentos(pagamentos: PagamentoData[]): string {
  const BOM = '\uFEFF';
  const linhas = pagamentos.map(p => gerarLinhaPagamento(p));
  return BOM + linhas.join('\n');
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Escapa ponto e vírgula no texto para não quebrar o CSV
 * Substitui por vírgula simples
 */
function escapeSemicolon(text: string): string {
  return text.replace(/;/g, ',');
}

/**
 * Gera nome do arquivo no padrão Carnê Leão
 * Exemplo: rendimentos_ABC_202601.csv
 */
export function gerarNomeArquivoCarneLeao(
  tipo: 'rendimentos' | 'pagamentos',
  codigoCliente: string,
  ano: number,
  mes: number
): string {
  const mesFormatado = mes.toString().padStart(2, '0');
  return `${tipo}_${codigoCliente}_${ano}${mesFormatado}.csv`;
}

/**
 * Valida se os dados estão dentro do limite de linhas
 */
export function validarLimiteLinhas(
  quantidadeRendimentos: number,
  quantidadePagamentos: number
): { valido: boolean; mensagem: string | null } {
  if (quantidadeRendimentos > LIMITE_LINHAS) {
    return {
      valido: false,
      mensagem: `Limite de ${LIMITE_LINHAS} linhas excedido para rendimentos (${quantidadeRendimentos}). Exporte em períodos menores.`
    };
  }
  
  if (quantidadePagamentos > LIMITE_LINHAS) {
    return {
      valido: false,
      mensagem: `Limite de ${LIMITE_LINHAS} linhas excedido para pagamentos (${quantidadePagamentos}). Exporte em períodos menores.`
    };
  }
  
  return { valido: true, mensagem: null };
}
