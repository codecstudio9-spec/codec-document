-- Smart Quotes: permite al CLIENTE (sin sesion, solo con su token de
-- firma valido) rechazar la cotizacion explicitamente -- hasta ahora
-- 'rejected' existia en el CHECK de status pero nada lo activaba nunca.
--
-- Solo cambia el estado si sigue en 'sent'/'viewed' -- no se puede
-- "des-aceptar" una ya firmada, y rechazarla dos veces es un no-op.

CREATE OR REPLACE FUNCTION public.reject_quote_public(p_quote_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_updated integer;
BEGIN
  UPDATE public.quotes SET status = 'rejected', updated_at = now()
  WHERE id = p_quote_id AND status IN ('sent', 'viewed');
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.reject_quote_public(uuid) TO anon, authenticated;
