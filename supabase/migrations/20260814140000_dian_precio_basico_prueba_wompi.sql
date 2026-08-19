-- Prueba puntual del checkout de Wompi tras rotar las llaves: baja el precio
-- del plan Básico a $1.500 COP para hacer un cobro real de bajo monto.
-- Revertir con 20260814150000_dian_precio_basico_revertir.sql en cuanto
-- termine la prueba -- este precio NO es el de venta real.
update public.ed_plans
set price_cop = 1500,
    updated_at = now()
where code = 'basico';
