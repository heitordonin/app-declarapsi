-- Add completion_notes column to obligation_instances
ALTER TABLE obligation_instances 
ADD COLUMN completion_notes text;