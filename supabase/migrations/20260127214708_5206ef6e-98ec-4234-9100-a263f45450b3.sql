-- Add paid_at column to documents table for tracking when client marked payment as paid
ALTER TABLE documents 
ADD COLUMN paid_at timestamp with time zone DEFAULT NULL;