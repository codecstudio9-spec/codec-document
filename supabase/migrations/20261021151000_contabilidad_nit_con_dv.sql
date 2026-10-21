-- El NIT escrito con su dígito de verificación («900.111.222-3») se guardaba
-- como 9001112223: el DV quedaba pegado y ningún XML de esa empresa le
-- llegaba, porque los XML traen el NIT sin DV. Ahora lo que va después del
-- guion se separa al campo dv.

CREATE OR REPLACE FUNCTION public.cont_empresa_validar()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_max    integer;
  v_usadas integer;
  v_bruto  text := trim(coalesce(NEW.nit, ''));
BEGIN
  IF v_bruto ~ '-\s*[0-9]\s*$' THEN
    NEW.dv := coalesce(nullif(NEW.dv, ''), regexp_replace(substring(v_bruto from '-\s*([0-9])\s*$'), '\s', '', 'g'));
    v_bruto := regexp_replace(v_bruto, '-\s*[0-9]\s*$', '');
  END IF;
  NEW.nit := regexp_replace(v_bruto, '[^0-9]', '', 'g');
  IF NEW.nit !~ '^[0-9]{3,15}$' THEN
    RAISE EXCEPTION 'El NIT debe tener entre 3 y 15 dígitos, sin dígito de verificación';
  END IF;
  NEW.updated_at := now();

  IF NEW.activo AND (TG_OP = 'INSERT' OR NOT OLD.activo) THEN
    IF NOT public.cont_acceso_activo(NEW.owner_user_id) THEN
      RAISE EXCEPTION 'Necesitas el plan de Contabilidad (o la prueba gratis) para agregar empresas';
    END IF;
    v_max := public.cont_max_empresas(NEW.owner_user_id);
    IF v_max IS NOT NULL THEN
      SELECT count(*) INTO v_usadas FROM fiscal_entities
      WHERE owner_user_id = NEW.owner_user_id AND activo AND id <> NEW.id;
      IF v_usadas >= v_max THEN
        RAISE EXCEPTION 'Tu plan permite % empresas activas. Archiva una o pasa a un plan más grande.', v_max;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
