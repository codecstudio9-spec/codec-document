-- Deja la promoción de lanzamiento APAGADA. El plan Gratis vuelve a 50.
--
-- La migración anterior encendió una promo de 100 documentos durante 30 días.
-- Se apaga porque la decisión de encenderla no estaba tomada: se pidió
-- primero la cuenta de lo que cuesta.
--
-- Se apaga poniendo `promo_until` a NULL, no borrando las columnas. Toda la
-- maquinaria —el tope efectivo en `ed_plan_vigente()`, las dos cifras en
-- `ed_planes_listar()`, el aviso en la pantalla de planes— queda montada y
-- probada. Encenderla el día que se decida es una línea:
--
--   UPDATE public.ed_plans
--      SET promo_xml_limit = 100,
--          promo_until     = now() + interval '30 days',
--          updated_at      = now()
--    WHERE code = 'gratis';
--
-- Y se apaga sola en la fecha, sin que nadie tenga que acordarse.

UPDATE public.ed_plans
   SET promo_xml_limit = NULL,
       promo_until     = NULL,
       updated_at      = now()
 WHERE code = 'gratis';
