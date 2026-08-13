-- Promoción de lanzamiento: el plan Gratis pasa de 50 a 100 documentos al mes,
-- y vuelve solo a 50 cuando se acaba.
--
-- ── Por qué con fecha y no cambiando el número ───────────────────────────
-- Lo fácil era poner 100 y apuntar en algún sitio «bajarlo a 50 en un mes».
-- Eso se olvida. Y olvidarlo no es un detalle: significa regalar el doble
-- para siempre, a todos los contadores que entren desde ahora, sin haberlo
-- decidido. Con fecha, el sistema lo baja solo el día que toca.
--
-- Además permite decirlo en pantalla con la verdad completa —«100 hasta el X,
-- después 50»— en vez de un «100» a secas que se convierte en una sorpresa
-- desagradable el mes siguiente.
--
-- ── Dónde se aplica ──────────────────────────────────────────────────────
-- El tope efectivo se calcula en UN sitio: `ed_plan_vigente()`, que ya
-- devuelve la fila entera del plan y de la que cuelga todo lo demás —el
-- control de cuota, el aviso de límite, si el correo está disponible—. Ninguna
-- de esas funciones necesita enterarse de que existen las promociones.
--
-- `ed_planes_listar()` sí las conoce, porque el catálogo tiene que enseñar las
-- dos cifras: la de ahora y la de después.

ALTER TABLE public.ed_plans
  ADD COLUMN IF NOT EXISTS promo_xml_limit integer
    CHECK (promo_xml_limit IS NULL OR promo_xml_limit > 0),
  ADD COLUMN IF NOT EXISTS promo_until timestamptz;

COMMENT ON COLUMN public.ed_plans.promo_xml_limit IS
  'Tope temporal que sustituye a monthly_xml_limit mientras promo_until esté en el futuro.';
COMMENT ON COLUMN public.ed_plans.promo_until IS
  'Cuándo caduca la promoción. Pasada esta fecha vuelve a valer monthly_xml_limit, sin que nadie tenga que tocar nada.';

-- 30 días desde que se aplica esta migración.
UPDATE public.ed_plans
   SET promo_xml_limit = 100,
       promo_until     = now() + interval '30 days',
       updated_at      = now()
 WHERE code = 'gratis';

-- ── El tope efectivo, en un solo sitio ────────────────────────────────────

/** Devuelve el plan del contador con el tope que de verdad le aplica hoy.
 *
 *  Se sobrescribe `monthly_xml_limit` sobre la fila ya leída en vez de
 *  construir una fila nueva campo a campo: así añadir una columna a `ed_plans`
 *  mañana no rompe esto en silencio por quedar desordenada. */
CREATE OR REPLACE FUNCTION public.ed_plan_vigente(p_user_id uuid DEFAULT auth.uid())
RETURNS public.ed_plans
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v public.ed_plans;
BEGIN
  SELECT p.* INTO v
  FROM ed_plans p
  WHERE p.code = COALESCE(
    (SELECT s.plan_code FROM ed_subscriptions s
      WHERE s.user_id = p_user_id
        AND s.status = 'active'
        AND s.current_period_end > now()),
    'gratis'
  );

  IF v.promo_xml_limit IS NOT NULL
     AND v.promo_until IS NOT NULL
     AND v.promo_until > now() THEN
    v.monthly_xml_limit := v.promo_xml_limit;
  END IF;

  RETURN v;
END $$;

REVOKE ALL ON FUNCTION public.ed_plan_vigente(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_plan_vigente(uuid) TO authenticated, service_role;

-- ── El catálogo enseña las dos cifras ─────────────────────────────────────

/** `limite` es lo que aplica AHORA. `limite_normal` y `promo_hasta` sólo
 *  vienen cuando hay promoción viva, para que la pantalla pueda decir hasta
 *  cuándo dura y a qué se vuelve después. */
CREATE OR REPLACE FUNCTION public.ed_planes_listar()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'code',       code,
    'nombre',     name,
    'precio',     price_cop,
    'limite',     CASE
                    WHEN promo_xml_limit IS NOT NULL AND promo_until > now()
                      THEN promo_xml_limit
                    ELSE monthly_xml_limit
                  END,
    'limite_normal', CASE
                       WHEN promo_xml_limit IS NOT NULL AND promo_until > now()
                         THEN monthly_xml_limit
                     END,
    'promo_hasta',   CASE
                       WHEN promo_xml_limit IS NOT NULL AND promo_until > now()
                         THEN promo_until
                     END,
    'uso_justo',  fair_use_note,
    -- Se dice explícitamente si se puede comprar. Un precio nulo en la
    -- pantalla se leería como «gratis», que es lo contrario de la verdad.
    'a_la_venta', (price_cop IS NOT NULL AND price_cop > 0)
  ) ORDER BY sort_order), '[]'::jsonb)
  FROM ed_plans WHERE active;
$$;

REVOKE ALL ON FUNCTION public.ed_planes_listar() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_planes_listar() TO authenticated;
