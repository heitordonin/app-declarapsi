/**
 * Utilitário para validação de período de apuração fiscal
 * 
 * Regra: A partir do dia 10 de cada mês, a equipe faz a apuração do carnê-leão.
 * - Até o dia 10: pode alterar cobranças do mês atual e do mês anterior
 * - A partir do dia 10: só pode alterar cobranças do mês atual
 */

const CUTOFF_DAY = 10;

/**
 * Verifica se uma data alvo está dentro do período permitido para alterações
 */
export function isWithinAllowedPeriod(targetDate: Date): boolean {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();
  
  // Mês atual é sempre permitido
  if (targetMonth === currentMonth && targetYear === currentYear) {
    return true;
  }
  
  // Se estamos antes do dia 10, permite também o mês anterior
  if (currentDay < CUTOFF_DAY) {
    // Calcula o mês anterior
    let previousMonth = currentMonth - 1;
    let previousYear = currentYear;
    
    if (previousMonth < 0) {
      previousMonth = 11; // Dezembro
      previousYear = currentYear - 1;
    }
    
    if (targetMonth === previousMonth && targetYear === previousYear) {
      return true;
    }
  }
  
  return false;
}

/**
 * Verifica se pode marcar uma cobrança como paga na data especificada
 */
export function canMarkAsPaidOnDate(paymentDate: Date): boolean {
  return isWithinAllowedPeriod(paymentDate);
}

/**
 * Verifica se pode modificar uma cobrança paga (marcar como não pago ou excluir)
 * @param paymentDateStr - Data de pagamento em formato ISO string (YYYY-MM-DD)
 */
export function canModifyPaidCharge(paymentDateStr: string | null): boolean {
  if (!paymentDateStr) {
    // Se não tem data de pagamento, não há restrição (cobrança não está paga)
    return true;
  }
  
  const paymentDate = new Date(paymentDateStr + 'T00:00:00');
  return isWithinAllowedPeriod(paymentDate);
}

/**
 * Retorna a mensagem de erro padrão para ações bloqueadas
 */
export function getRestrictionMessage(): string {
  return 'Não é possível realizar esta alteração pois o período de apuração já foi encerrado. Em caso de necessidade, entre em contato com o suporte.';
}

/**
 * Retorna uma descrição do período atualmente permitido para exibição ao usuário
 */
export function getAllowedPeriodDescription(): string {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  if (currentDay < CUTOFF_DAY) {
    let previousMonth = currentMonth - 1;
    let previousYear = currentYear;
    
    if (previousMonth < 0) {
      previousMonth = 11;
      previousYear = currentYear - 1;
    }
    
    return `${monthNames[previousMonth]}/${previousYear} ou ${monthNames[currentMonth]}/${currentYear}`;
  }
  
  return `${monthNames[currentMonth]}/${currentYear}`;
}

/**
 * Verifica se pode modificar uma despesa (criar, editar ou excluir)
 * @param paymentDateStr - Data de pagamento em formato ISO string (YYYY-MM-DD)
 */
export function canModifyExpense(paymentDateStr: string): boolean {
  const paymentDate = new Date(paymentDateStr + 'T00:00:00');
  return isWithinAllowedPeriod(paymentDate);
}
