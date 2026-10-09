-- notify-completion es pública (verify_jwt = false: la llama un firmante
-- anónimo). Sin esta marca, cualquiera con el enlace /sign/:id de un documento
-- ya firmado podía volver a llamarla en bucle y mandarle correos sin fin al
-- creador desde notificaciones@codecdocument.com. Con ella, cada documento
-- avisa una sola vez (se reclama atómicamente antes de enviar).
ALTER TABLE public.sign_transactions
  ADD COLUMN IF NOT EXISTS completion_notified_at timestamptz;

-- Los ya completados no deben disparar avisos atrasados.
UPDATE public.sign_transactions
   SET completion_notified_at = now()
 WHERE status = 'completed' AND completion_notified_at IS NULL;
