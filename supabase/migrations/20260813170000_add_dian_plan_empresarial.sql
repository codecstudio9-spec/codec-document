-- Plan Empresarial: $299.000 COP/mes, 23.000 XML al mes.
--
-- Va entre Profesional (8.000) e Ilimitado. Se añade como migración y no con
-- un UPDATE suelto para que una base creada desde cero tenga los cinco planes
-- sin que nadie se acuerde de insertarlo a mano.
--
-- El precio y el límite se siguen pudiendo cambiar sin desplegar, con
-- ed_plan_configurar() o un UPDATE sobre ed_plans.
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

INSERT INTO public.ed_plans (code, name, price_cop, monthly_xml_limit, fair_use_note, sort_order)
VALUES ('empresarial', 'Empresarial', 299000, 23000, NULL, 4)
ON CONFLICT (code) DO UPDATE
  SET price_cop = excluded.price_cop,
      monthly_xml_limit = excluded.monthly_xml_limit,
      sort_order = excluded.sort_order,
      updated_at = now();

-- El Ilimitado se corre al final de la lista.
UPDATE public.ed_plans SET sort_order = 5, updated_at = now() WHERE code = 'ilimitado';

-- Verificación
SELECT code, name, price_cop, monthly_xml_limit, sort_order
FROM public.ed_plans ORDER BY sort_order;
