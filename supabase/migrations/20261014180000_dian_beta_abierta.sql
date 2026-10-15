-- Fin de la "beta" del módulo DIAN (2026-10-14).
--
-- dian_beta_cierre seguía en 2026-08-15: desde esa fecha ed_beta_estado
-- devolvía cerrada = true y TODO usuario no administrador y sin plan de pago
-- recibía "beta cerrada" al importar, o sea que el plan Gratis (50 XML/mes)
-- no funcionaba para nadie nuevo. El límite real ahora es el de cada plan
-- (ed_plans.monthly_xml_limit), así que el cierre se quita y el tope global
-- de capacidad se sube a un valor que no frena el uso normal.

UPDATE public.app_settings SET value = ''       WHERE key = 'dian_beta_cierre';
UPDATE public.app_settings SET value = '5000000' WHERE key = 'dian_beta_limite_global';
-- Por persona manda el plan; este tope de la beta no debe quedar por debajo
-- del plan Gratis.
UPDATE public.app_settings SET value = '1000000' WHERE key = 'dian_beta_limite_persona';
