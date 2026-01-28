/**
 * Validação completa de CPF conforme algoritmo da Receita Federal
 */

/**
 * Valida se um CPF é válido
 * @param cpf - CPF com ou sem formatação
 * @returns true se válido, false se inválido
 */
export function validarCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) return false;
  
  // Verifica CPFs inválidos conhecidos (todos dígitos iguais)
  if (/^(\d)\1+$/.test(cpfLimpo)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(10))) return false;
  
  return true;
}

/**
 * Verifica se um CPF está preenchido (11 dígitos)
 * Não valida os dígitos verificadores
 */
export function cpfPreenchido(cpf: string | null | undefined): boolean {
  if (!cpf) return false;
  const cpfLimpo = cpf.replace(/\D/g, '');
  return cpfLimpo.length === 11;
}

/**
 * Formata CPF para exibição (XXX.XXX.XXX-XX)
 */
export function formatarCPF(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Resultado da validação de CPFs para exportação
 */
export interface ValidacaoCPFResult {
  valido: boolean;
  erros: string[];
  cpfsInvalidos: string[];
}

/**
 * Valida múltiplos CPFs e retorna resultado consolidado
 */
export function validarCPFsParaExportacao(
  cpfCliente: string | null,
  cpfsPagadores: string[],
  cpfsBeneficiarios: string[]
): ValidacaoCPFResult {
  const erros: string[] = [];
  const cpfsInvalidos: string[] = [];
  
  // Valida CPF do cliente/profissional
  if (!cpfCliente || !cpfPreenchido(cpfCliente)) {
    erros.push('CPF do profissional não está preenchido no cadastro.');
  } else if (!validarCPF(cpfCliente)) {
    erros.push('CPF do profissional é inválido.');
    cpfsInvalidos.push(formatarCPF(cpfCliente));
  }
  
  // Valida CPFs dos pagadores
  const pagadoresInvalidos = cpfsPagadores.filter(cpf => {
    if (!cpfPreenchido(cpf)) return true;
    return !validarCPF(cpf);
  });
  
  if (pagadoresInvalidos.length > 0) {
    erros.push(`${pagadoresInvalidos.length} CPF(s) de pagador inválido(s).`);
    pagadoresInvalidos.forEach(cpf => {
      if (cpfPreenchido(cpf)) {
        cpfsInvalidos.push(formatarCPF(cpf));
      }
    });
  }
  
  // Valida CPFs dos beneficiários
  const beneficiariosInvalidos = cpfsBeneficiarios.filter(cpf => {
    if (!cpfPreenchido(cpf)) return true;
    return !validarCPF(cpf);
  });
  
  if (beneficiariosInvalidos.length > 0) {
    erros.push(`${beneficiariosInvalidos.length} CPF(s) de beneficiário inválido(s).`);
    beneficiariosInvalidos.forEach(cpf => {
      if (cpfPreenchido(cpf)) {
        cpfsInvalidos.push(formatarCPF(cpf));
      }
    });
  }
  
  return {
    valido: erros.length === 0,
    erros,
    cpfsInvalidos: [...new Set(cpfsInvalidos)], // Remove duplicatas
  };
}
