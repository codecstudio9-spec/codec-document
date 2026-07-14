-- ============================================================
-- CODEC DOCUMENT — Corrige falso "ya firmado" en el flujo de firma móvil
-- Ejecutar una vez en Supabase Dashboard → SQL Editor
--
-- BUG (reportado en producción): supabase_lockdown_public_read_migration.sql
-- quitó la política pública de SELECT en sign_transactions (correcto, por
-- privacidad — esa tabla guarda selfies y fotos de cédula). Pero el UPDATE
-- final del firmante invitado encadena `.select('id')` para confirmar que
-- sí se aplicó — y bajo RLS de Postgres, un UPDATE...RETURNING solo puede
-- devolver filas que el que ejecuta la consulta tiene permiso de LEER.
-- Como el firmante invitado (anónimo, no es el creator_id) ya no tiene
-- ningún permiso de SELECT sobre esa tabla, el UPDATE se aplicaba
-- correctamente en la base, pero PostgREST devolvía 0 filas — y el guard
-- anti-condición-de-carrera (agregado en la misma sesión) interpretaba
-- eso como "alguien más ya lo firmó", aunque en realidad SÍ se acababa de
-- firmar. El firmante veía "Documento ya firmado" en vez de éxito.
--
-- SOLUCIÓN: mover esa escritura crítica a una función RPC SECURITY
-- DEFINER — igual que ya se hizo para las lecturas — para que no dependa
-- de la política de SELECT del que llama. El chequeo de condición de
-- carrera (status esperado vs. status actual) se hace DENTRO de la
-- función, de forma atómica, y devuelve un booleano confiable.
-- ============================================================

CREATE OR REPLACE FUNCTION public.complete_sign_transaction(
  p_id              uuid,
  p_expected_status text,
  p_payload         jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.sign_transactions
  SET
    status                 = COALESCE(p_payload->>'status', status),
    recipient_signature    = COALESCE(p_payload->>'recipient_signature', recipient_signature),
    recipient_selfie       = COALESCE(p_payload->>'recipient_selfie', recipient_selfie),
    recipient_id_photo     = COALESCE(p_payload->>'recipient_id_photo', recipient_id_photo),
    recipient_ip           = COALESCE(p_payload->>'recipient_ip', recipient_ip),
    esign_consent_accepted = COALESCE((p_payload->>'esign_consent_accepted')::boolean, esign_consent_accepted),
    signed_at               = COALESCE((p_payload->>'signed_at')::timestamptz, signed_at)
  WHERE id = p_id
    AND status = p_expected_status;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_sign_transaction(uuid, text, jsonb) TO anon, authenticated;

-- Misma historia para el parche en segundo plano que reemplaza el selfie/
-- foto de cédula en base64 por la URL final de Storage — también encadenaba
-- un UPDATE sin necesitar SELECT de vuelta, así que esa parte en sí no
-- estaba rota, pero la movemos a la misma función por consistencia y para
-- que quede protegida contra el mismo problema si en el futuro alguien le
-- agrega un `.select()`.
CREATE OR REPLACE FUNCTION public.patch_sign_transaction_evidence(
  p_id      uuid,
  p_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sign_transactions
  SET
    recipient_selfie   = COALESCE(p_payload->>'recipient_selfie', recipient_selfie),
    recipient_id_photo = COALESCE(p_payload->>'recipient_id_photo', recipient_id_photo)
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.patch_sign_transaction_evidence(uuid, jsonb) TO anon, authenticated;

-- ============================================================
-- Mismo bug, mismo origen, en el OTRO flujo de firma (el más antiguo:
-- guest-sign-page.tsx / lib/signatureService.ts, tabla `signers`).
-- supabase_lockdown_public_read_migration.sql también quitó
-- "anon_read_signers", así que tryCompleteSignerOnce() tenía exactamente
-- el mismo problema: el UPDATE se aplicaba, pero `.select('id')` volvía
-- vacío para el firmante invitado, y el guard reportaba falsamente
-- "ya fue firmado".
-- ============================================================

CREATE OR REPLACE FUNCTION public.try_complete_signer_once(
  p_signer_id   uuid,
  p_from_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.signers
  SET status = 'completed'
  WHERE id = p_signer_id
    AND status = p_from_status;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.try_complete_signer_once(uuid, text) TO anon, authenticated;

-- ============================================================
-- Aun mas grave: supabase_lockdown_public_read_migration.sql quito
-- "anon_read_signers" y nunca la reemplazo por NADA -- la tabla `signers`
-- se quedo sin ninguna politica de SELECT, ni siquiera para el creador
-- autenticado. createSigner() hace `.insert(...).select('id').single()`
-- para obtener el id de la fila recien creada, y `.single()` lanza error
-- si no puede leer de vuelta ninguna fila. Esto rompia el paso "invitar
-- firmante" del flujo de escritorio (electronic-signature-page.tsx) por
-- completo, no solo el flujo movil.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_signer(
  p_document_id uuid,
  p_name        text,
  p_email       text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.signers (document_id, name, email, status)
  VALUES (p_document_id, p_name, p_email, 'pending')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_signer(uuid, text, text) TO anon, authenticated;

-- ============================================================
-- Y una tercera instancia: createSignTransaction() (llamada por el
-- CREADOR/remitente -- el "celular" en el reporte de bug -- al enviar un
-- documento a firmar) tambien encadenaba `.insert(...).select('id').single()`.
-- La politica "tx_select_own" solo cubre `auth.uid()::text = creator_id`;
-- si el remitente no habia iniciado sesion (creator_id queda NULL), esa
-- comparacion nunca es verdadera y la creacion de la transaccion fallaba
-- (o, si el remitente si estaba logueado, esto en si funcionaba -- pero
-- lo movemos al mismo patron por consistencia y para no depender de si
-- el remitente esta autenticado o no).
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_sign_transaction(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.sign_transactions (
    creator_id, document_type, document_data, intent, security_config,
    status, sender_signature
  ) VALUES (
    p_payload->>'creator_id',
    p_payload->>'document_type',
    COALESCE(p_payload->'document_data', '{}'::jsonb),
    p_payload->>'intent',
    COALESCE(p_payload->'security_config', '{}'::jsonb),
    COALESCE(p_payload->>'status', 'pending'),
    p_payload->>'sender_signature'
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_sign_transaction(jsonb) TO anon, authenticated;
