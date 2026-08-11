-- Gobernador de peticiones hacia la DIAN.
--
-- El navegador no puede pedirle archivos a catalogo-vpfe.dian.gov.co
-- (CORS), asi que la descarga pasa por nuestro servidor. Eso significa que
-- el trafico de TODOS los contadores sale por las mismas IPs de Supabase.
--
-- Del video del "Descargador Masivo DIAN v1.2" se midio el ritmo real de
-- una herramienta de escritorio que lleva tiempo funcionando sin que la
-- bloqueen: 2000 CUFEs en ~30 minutos, es decir 1,1 peticiones por
-- segundo. Ese es el ritmo que la DIAN tolera desde una IP.
--
-- Un contador solo es indistinguible del uso normal. Veinte a la vez
-- serian 22 peticiones por segundo desde una sola IP: un patron que se
-- nota y que puede costar el bloqueo para TODOS los clientes a la vez.
--
-- De ahi este cubo de fichas global: el total nunca supera el limite,
-- pase lo que pase. Un contador solo va a velocidad completa; si hay
-- diez, cada uno va mas lento pero nadie se queda fuera.

CREATE TABLE IF NOT EXISTS public.ed_dian_rate (
  id           smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  -- Fichas disponibles ahora mismo.
  fichas       numeric NOT NULL DEFAULT 5,
  -- Fichas que se reponen por segundo. 2 = ritmo objetivo global.
  tasa         numeric NOT NULL DEFAULT 2,
  -- Techo del cubo: permite rafagas cortas sin superar la media.
  capacidad    numeric NOT NULL DEFAULT 5,
  actualizado  timestamptz NOT NULL DEFAULT now(),
  -- Cortacircuitos: si la DIAN empieza a rechazar, se para todo.
  pausado_hasta timestamptz,
  fallos_seguidos smallint NOT NULL DEFAULT 0,
  total_hoy    integer NOT NULL DEFAULT 0,
  dia          date NOT NULL DEFAULT current_date
);

INSERT INTO public.ed_dian_rate (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.ed_dian_rate ENABLE ROW LEVEL SECURITY;
-- Nadie la toca directamente: solo las funciones de abajo, que son
-- SECURITY DEFINER. Sin politicas, RLS bloquea todo acceso del cliente.

/**
 * Pide permiso para una peticion a la DIAN.
 *
 * Devuelve el numero de milisegundos que hay que esperar: 0 si puede ir
 * ya. El cliente espera ese tiempo y reintenta, en vez de recibir un error
 * -- una descarga de 2000 documentos no puede fallar porque otro contador
 * estaba descargando al mismo tiempo.
 */
CREATE OR REPLACE FUNCTION public.ed_dian_permiso()
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.ed_dian_rate%ROWTYPE;
  transcurrido numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesion'; END IF;

  -- FOR UPDATE serializa: dos workers no pueden gastar la misma ficha.
  SELECT * INTO r FROM public.ed_dian_rate WHERE id = 1 FOR UPDATE;

  IF r.pausado_hasta IS NOT NULL AND now() < r.pausado_hasta THEN
    RETURN jsonb_build_object(
      'permitido', false,
      'esperar_ms', ceil(extract(epoch FROM (r.pausado_hasta - now())) * 1000),
      'motivo', 'pausado'
    );
  END IF;

  IF r.dia <> current_date THEN
    r.total_hoy := 0;
    r.dia := current_date;
  END IF;

  transcurrido := extract(epoch FROM (now() - r.actualizado));
  r.fichas := least(r.capacidad, r.fichas + transcurrido * r.tasa);
  r.actualizado := now();

  IF r.fichas >= 1 THEN
    r.fichas := r.fichas - 1;
    r.total_hoy := r.total_hoy + 1;
    UPDATE public.ed_dian_rate SET
      fichas = r.fichas, actualizado = r.actualizado,
      total_hoy = r.total_hoy, dia = r.dia
    WHERE id = 1;
    RETURN jsonb_build_object('permitido', true, 'esperar_ms', 0);
  END IF;

  UPDATE public.ed_dian_rate SET
    fichas = r.fichas, actualizado = r.actualizado, dia = r.dia
  WHERE id = 1;

  RETURN jsonb_build_object(
    'permitido', false,
    'esperar_ms', ceil(((1 - r.fichas) / r.tasa) * 1000),
    'motivo', 'ritmo'
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_dian_permiso() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_dian_permiso() TO authenticated, service_role;

/**
 * Informa del resultado de una peticion, para que el cortacircuitos
 * aprenda. Tres fallos seguidos pausan un minuto; diez, cinco minutos.
 *
 * Sin esto, si la DIAN empieza a rechazar, seguiriamos insistiendo 2000
 * veces -- que es exactamente el comportamiento que hace que un bloqueo
 * temporal se vuelva permanente.
 */
CREATE OR REPLACE FUNCTION public.ed_dian_resultado(p_ok boolean)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE nuevos smallint;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesion'; END IF;

  IF p_ok THEN
    UPDATE public.ed_dian_rate
    SET fallos_seguidos = 0, pausado_hasta = NULL
    WHERE id = 1 AND (fallos_seguidos > 0 OR pausado_hasta IS NOT NULL);
    RETURN;
  END IF;

  UPDATE public.ed_dian_rate
  SET fallos_seguidos = least(fallos_seguidos + 1, 100)
  WHERE id = 1
  RETURNING fallos_seguidos INTO nuevos;

  IF nuevos >= 10 THEN
    UPDATE public.ed_dian_rate SET pausado_hasta = now() + interval '5 minutes' WHERE id = 1;
  ELSIF nuevos >= 3 THEN
    UPDATE public.ed_dian_rate SET pausado_hasta = now() + interval '1 minute' WHERE id = 1;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.ed_dian_resultado(boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_dian_resultado(boolean) TO authenticated, service_role;

/** Estado del gobernador, para el panel del propietario. */
CREATE OR REPLACE FUNCTION public.ed_dian_estado()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'tasa', tasa, 'capacidad', capacidad, 'fichas', round(fichas, 2),
    'total_hoy', CASE WHEN dia = current_date THEN total_hoy ELSE 0 END,
    'fallos_seguidos', fallos_seguidos,
    'pausado_hasta', pausado_hasta
  )
  FROM public.ed_dian_rate WHERE id = 1 AND public.is_admin_user();
$$;

REVOKE ALL ON FUNCTION public.ed_dian_estado() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_dian_estado() TO authenticated;
