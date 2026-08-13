-- Suelta el cortacircuitos de la DIAN y deja una forma de volver a soltarlo.
--
-- ── Qué pasó ─────────────────────────────────────────────────────────────
--
-- `ed_dian_resultado(false)` se llamaba ante CUALQUIER fallo al abrir sesión,
-- incluido el más común y más inocente: un token vencido. El token de la DIAN
-- dura 60 minutos y sólo sirve una vez, así que tropezar con uno agotado es
-- lo normal, no una anomalía.
--
-- Y el contador es GLOBAL —una sola fila, id = 1— porque todo el tráfico sale
-- por las mismas IPs de Supabase y la DIAN nos ve como un único cliente. Esa
-- parte es correcta. Lo que estaba mal era qué se contaba: tres enlaces
-- caducados seguidos —veinte segundos de intentos— dejaban la herramienta
-- pausada un minuto para TODOS los contadores, incluido quien acababa de
-- pedir un token nuevo. Diez, cinco minutos.
--
-- El arreglo de fondo está en la Edge Function (sólo alimenta el contador lo
-- que de verdad es la DIAN fallando). Esto suelta la pausa que quedó puesta.

UPDATE public.ed_dian_rate
SET fallos_seguidos = 0,
    pausado_hasta = NULL
WHERE id = 1;

-- ══════════════════════════════════════════════════════════════════════
-- Soltarlo a mano
-- ══════════════════════════════════════════════════════════════════════
--
-- Hace falta porque la pausa es global: si algo la deja puesta por error, no
-- hay nadie que pueda quitarla y sólo queda esperar. Con esto el
-- administrador la libera al momento.
CREATE OR REPLACE FUNCTION public.ed_dian_soltar()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;

  SELECT * INTO r FROM public.ed_dian_rate WHERE id = 1;

  UPDATE public.ed_dian_rate
  SET fallos_seguidos = 0, pausado_hasta = NULL
  WHERE id = 1;

  RETURN jsonb_build_object(
    'estaba_pausado', r.pausado_hasta IS NOT NULL AND now() < r.pausado_hasta,
    'fallos_seguidos_antes', r.fallos_seguidos,
    'pausado_hasta_antes', r.pausado_hasta
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.ed_dian_soltar() TO authenticated;

/** Estado del gobernador, para poder mirarlo sin adivinar. */
CREATE OR REPLACE FUNCTION public.ed_dian_estado()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  SELECT * INTO r FROM public.ed_dian_rate WHERE id = 1;
  RETURN jsonb_build_object(
    'pausado', r.pausado_hasta IS NOT NULL AND now() < r.pausado_hasta,
    'pausado_hasta', r.pausado_hasta,
    'fallos_seguidos', r.fallos_seguidos,
    'fichas', r.fichas,
    'dia', r.dia
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.ed_dian_estado() TO authenticated;

-- Verificación: debe salir sin pausa y con cero fallos.
SELECT fallos_seguidos, pausado_hasta FROM public.ed_dian_rate WHERE id = 1;
