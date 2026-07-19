-- Smart Quotes: cierra el ultimo hueco para el tablero "el cliente abrio
-- la propuesta hace 2 horas" -- record_quote_view() y get_quote_view_stats()
-- ya existian (ver supabase_add_smart_quotes_migration.sql), pero nada
-- llamaba a record_quote_view() nunca: el cliente firma en
-- /guest-sign/:token (guest-sign-page.tsx, el motor de firmas generico
-- ya existente), que no sabe que un documento en particular es en
-- realidad una cotizacion.
--
-- Esta funcion permite al lado del invitado (sin sesion) resolver
-- "¿este documento es una cotizacion, y cual?" a partir del documentId
-- que ya tiene legitimamente por su token de firma valido -- solo
-- devuelve un uuid, sin PII, seguro para anon.

CREATE OR REPLACE FUNCTION public.get_quote_id_by_document(p_document_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.quotes WHERE signature_transaction_id = p_document_id LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_quote_id_by_document(uuid) TO anon, authenticated;
