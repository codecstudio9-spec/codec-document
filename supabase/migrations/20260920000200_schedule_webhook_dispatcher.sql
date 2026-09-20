-- Programa webhook-dispatcher (ver supabase/functions/webhook-dispatcher)
-- para correr cada 2 minutos vía pg_cron + pg_net, sin depender de que
-- alguien configure un cron manual desde el Dashboard — exactamente lo
-- que supabase_add_webhooks_migration.sql dejó como "PENDIENTE".
--
-- Sin secreto compartido a propósito: la función no crea ni expone nada
-- que su propio dueño no pudiera ya ver, solo reenvía eventos que los
-- triggers de la empresa ya encolaron desde actividad real de documentos/
-- firmas hacia URLs que esa misma empresa registró. Ver el comentario en
-- supabase/functions/webhook-dispatcher/index.ts.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'webhook-dispatcher-every-2-min';

SELECT cron.schedule(
  'webhook-dispatcher-every-2-min',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yxzchnldmfsgdtbjurey.supabase.co/functions/v1/webhook-dispatcher',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
