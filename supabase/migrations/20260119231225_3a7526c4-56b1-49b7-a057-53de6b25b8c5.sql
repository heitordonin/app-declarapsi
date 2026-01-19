-- Add viewed_at column to track when client downloaded/viewed the document
ALTER TABLE public.documents
ADD COLUMN viewed_at timestamp with time zone DEFAULT NULL;