import type { Json } from '@/integrations/supabase/types';

// Types for OCR processing of tax documents (DARF and GPS)

export type OcrStatus = 'pending' | 'processing' | 'success' | 'needs_review' | 'error';
export type DocumentType = 'darf' | 'gps' | 'unknown';

export interface OcrExtractedData {
  cpf?: string | null;
  nit_nis?: string | null;
  codigo?: string | null;
  competencia?: string | null;
  vencimento?: string | null;
  valor?: number | null;
}

export interface OcrMatchResult {
  client_id?: string | null;
  client_name?: string | null;
  client_code?: string | null;
  client_found: boolean;
  client_error?: string | null;
  obligation_id?: string | null;
  obligation_name?: string | null;
  obligation_found: boolean;
  obligation_error?: string | null;
}

export interface OcrData {
  document_type: DocumentType;
  confidence: number;
  extracted_data: OcrExtractedData;
  matching: OcrMatchResult;
  raw_text?: string;
}

export interface StagingUploadWithOcr {
  id: string;
  org_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  state: string;
  client_id: string | null;
  obligation_id: string | null;
  competence: string | null;
  amount: number | null;
  due_at: string | null;
  created_at: string;
  ocr_status: OcrStatus | string | null;
  ocr_data: OcrData | Json | null;
  ocr_error: string | null;
  document_type: DocumentType | string | null;
}

// Map of fiscal codes to obligation types
export const FISCAL_CODE_MAP: Record<string, string> = {
  '0190': 'DARF Carnê Leão',
  '1163': 'INSS 1163',
  '1007': 'INSS 1007',
};

// Helper to format CPF for display
export function formatCpfForDisplay(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

// Helper to format NIT/NIS for display
export function formatNitNisForDisplay(nitNis: string): string {
  const cleaned = nitNis.replace(/\D/g, '');
  if (cleaned.length !== 11) return nitNis;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 8)}.${cleaned.slice(8, 10)}-${cleaned.slice(10)}`;
}
