-- Limpieza de los leads de prueba insertados al verificar submit_business_lead().
DELETE FROM public.admin_business_leads WHERE email = 'qa@test.com';
