UPDATE public.ed_plans
   SET price_cop = 60000,
       updated_at = now()
 WHERE code = 'basico';

UPDATE public.ed_plans
   SET price_cop = 90000,
       updated_at = now()
 WHERE code = 'profesional';

UPDATE public.ed_plans
   SET price_cop = 180000,
       updated_at = now()
 WHERE code = 'empresarial';
