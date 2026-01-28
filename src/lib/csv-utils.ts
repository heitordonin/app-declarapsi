/**
 * Utilitários para geração e download de arquivos CSV
 */

export interface CsvColumn<T> {
  header: string;
  render: (item: T) => string | number | null;
}

/**
 * Escapa valores para CSV (aspas, vírgulas, quebras de linha)
 */
export function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // Se contém vírgula, aspas ou quebra de linha, precisa escapar
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Escapa aspas duplas duplicando-as
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return stringValue;
}

/**
 * Gera string CSV a partir de array de objetos
 * Inclui BOM para UTF-8 (Excel reconhece acentos)
 */
export function generateCsv<T>(data: T[], columns: CsvColumn<T>[]): string {
  // BOM para UTF-8
  const BOM = '\uFEFF';
  
  // Header
  const header = columns.map(col => escapeCsvValue(col.header)).join(',');
  
  // Rows
  const rows = data.map(item => 
    columns.map(col => escapeCsvValue(col.render(item))).join(',')
  );
  
  return BOM + header + '\n' + rows.join('\n');
}

/**
 * Trigger download do arquivo CSV
 */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Formata data para DD/MM/YYYY (padrão brasileiro)
 */
export function formatDateBR(dateString: string | null): string {
  if (!dateString) return '';
  
  const date = new Date(dateString + 'T00:00:00');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formata valor numérico com ponto como separador decimal
 */
export function formatNumberCSV(value: number | null): string {
  if (value === null || value === undefined) return '0.00';
  return value.toFixed(2);
}

/**
 * Remove formatação de CPF (pontos e traços)
 */
export function cleanCpf(cpf: string | null): string {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '');
}
