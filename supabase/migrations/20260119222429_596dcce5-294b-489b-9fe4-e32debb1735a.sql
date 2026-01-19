-- Add OCR processing fields to staging_uploads
ALTER TABLE staging_uploads 
ADD COLUMN IF NOT EXISTS ocr_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ocr_data JSONB,
ADD COLUMN IF NOT EXISTS ocr_error TEXT,
ADD COLUMN IF NOT EXISTS document_type TEXT;

-- Add fiscal code to obligations for matching OCR-extracted codes
ALTER TABLE obligations ADD COLUMN IF NOT EXISTS fiscal_code TEXT;

-- Add comments for documentation
COMMENT ON COLUMN staging_uploads.ocr_status IS 'OCR processing status: pending | processing | success | needs_review | error';
COMMENT ON COLUMN staging_uploads.ocr_data IS 'JSON with extracted OCR data including matched client/obligation info';
COMMENT ON COLUMN staging_uploads.ocr_error IS 'Error message if OCR failed or needs review';
COMMENT ON COLUMN staging_uploads.document_type IS 'Detected document type: darf | gps | unknown';
COMMENT ON COLUMN obligations.fiscal_code IS 'Fiscal code for OCR matching (e.g., 0190 for Carnê Leão, 1163/1007 for INSS)';