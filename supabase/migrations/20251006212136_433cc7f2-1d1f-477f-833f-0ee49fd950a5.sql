-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para enviar lembretes diários às 9h da manhã (horário de Brasília = 12:00 UTC)
SELECT cron.schedule(
  'send-due-reminders-daily',
  '0 12 * * *', -- 12:00 UTC = 09:00 Brasília
  $$
  SELECT
    net.http_post(
        url:='https://jfxmwgyysbkdsdofefcp.supabase.co/functions/v1/send-due-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmeG13Z3l5c2JrZHNkb2ZlZmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDY1NjgsImV4cCI6MjA3NTMyMjU2OH0.RKLOVtgxaSmqcM9A7hQadxNhr0sfRz6n0fofv7jnhQI"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);