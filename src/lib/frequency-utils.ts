import { FrequencyType } from "@/types/database";

export const FREQUENCY_CONFIG = {
  weekly: { label: 'Semanal', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' },
  monthly: { label: 'Mensal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' },
  annual: { label: 'Anual', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' }
} as const;

export const getFrequencyLabel = (freq: FrequencyType) => 
  FREQUENCY_CONFIG[freq].label;

export const getFrequencyColor = (freq: FrequencyType) => 
  FREQUENCY_CONFIG[freq].color;

/**
 * Gera array de competências (MM/YYYY) baseado na frequência
 */
export function generateCompetences(
  startDate: Date,
  frequency: FrequencyType,
  monthsAhead: number
): string[] {
  const competences: string[] = [];
  const today = new Date();
  
  // Começar a partir do mês atual ou mês de criação do vínculo
  let currentDate = new Date(Math.max(startDate.getTime(), today.getTime()));
  currentDate.setDate(1); // Primeiro dia do mês
  
  const endDate = new Date(currentDate);
  endDate.setMonth(endDate.getMonth() + monthsAhead);

  while (currentDate <= endDate) {
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    
    if (frequency === 'monthly') {
      competences.push(`${month}/${year}`);
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (frequency === 'annual') {
      // Gerar apenas para o mesmo mês a cada ano
      if (currentDate.getMonth() === startDate.getMonth()) {
        competences.push(`${month}/${year}`);
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (frequency === 'weekly') {
      // Para semanal, geramos mensalmente (pode ajustar depois)
      competences.push(`${month}/${year}`);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  return competences;
}

/**
 * Calcula data de vencimento baseada na competência e regra legal
 */
export function calculateDueDate(competence: string, legalDueRule: number | null): Date {
  const [month, year] = competence.split('/').map(Number);
  
  if (!legalDueRule) {
    // Se não tem regra, vence no último dia do mês seguinte
    return new Date(year, month, 0); // Último dia do mês seguinte
  }

  // Vencimento é no dia especificado do mês seguinte
  return new Date(year, month, legalDueRule);
}

/**
 * Calcula data da meta interna baseada na competência e dia alvo
 */
export function calculateInternalTargetDate(competence: string, targetDay: number): Date {
  const [month, year] = competence.split('/').map(Number);
  
  // Meta interna é no dia especificado do mês da competência
  return new Date(year, month - 1, targetDay);
}
