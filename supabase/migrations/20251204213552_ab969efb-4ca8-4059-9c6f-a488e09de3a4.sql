-- Add new columns to clients table for profile data
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS crp_number text;

-- Create RLS policy for clients to update their own profile
CREATE POLICY "Clients can update their own profile"
ON public.clients
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());