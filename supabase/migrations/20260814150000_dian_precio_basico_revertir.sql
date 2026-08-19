-- Revierte el precio de prueba de la migración 20260814140000: termina la
-- prueba del checkout de Wompi con las llaves rotadas, vuelve el plan
-- Básico a su precio real de venta.
update public.ed_plans
set price_cop = 53000,
    updated_at = now()
where code = 'basico';
