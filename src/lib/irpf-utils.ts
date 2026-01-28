// Tabela progressiva mensal do IRPF 2024/2025
const IRPF_TABLE = [
  { limit: 2259.20, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 169.44 },
  { limit: 3751.05, rate: 0.15, deduction: 381.44 },
  { limit: 4664.68, rate: 0.225, deduction: 662.77 },
  { limit: Infinity, rate: 0.275, deduction: 896.00 },
];

/**
 * Calcula a alíquota efetiva do IRPF baseado na renda mensal
 * @param monthlyIncome - Renda mensal bruta
 * @returns Alíquota efetiva em porcentagem (ex: 15.2 para 15,2%)
 */
export function calculateEffectiveRate(monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0;
  
  const bracket = IRPF_TABLE.find(b => monthlyIncome <= b.limit);
  if (!bracket) return 0;
  
  const tax = (monthlyIncome * bracket.rate) - bracket.deduction;
  return tax > 0 ? (tax / monthlyIncome) * 100 : 0;
}

/**
 * Calcula o imposto mensal estimado
 * @param monthlyIncome - Renda mensal bruta
 * @returns Valor do imposto em reais
 */
export function calculateMonthlyTax(monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0;
  
  const bracket = IRPF_TABLE.find(b => monthlyIncome <= b.limit);
  if (!bracket) return 0;
  
  const tax = (monthlyIncome * bracket.rate) - bracket.deduction;
  return tax > 0 ? tax : 0;
}

/**
 * Retorna a faixa de alíquota nominal baseada na renda
 * @param monthlyIncome - Renda mensal bruta
 * @returns Alíquota nominal em porcentagem
 */
export function getNominalRate(monthlyIncome: number): number {
  const bracket = IRPF_TABLE.find(b => monthlyIncome <= b.limit);
  return bracket ? bracket.rate * 100 : 0;
}
