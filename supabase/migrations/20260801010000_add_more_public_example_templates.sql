-- Wires up 6 already-built example Word templates that were sitting
-- unused in Storage (documents-bucket/templates/558a7616-98d1-445c-9ae5-58d15543bbe4/docx-template-example-*.docx)
-- with no corresponding public.templates row at all, so they never showed
-- up in the "Mis Plantillas" example gallery for anyone. Same author/owner
-- and same shape as the two examples already flagged public in
-- 20260731030000_add_public_example_templates.sql (construction, loan).

INSERT INTO public.templates (
  user_id, name, kind, file_url, docx_file_url, detected_fields, signers, security_config,
  is_public_example, example_label, instructions_es, instructions_en
) VALUES (
  '558a7616-98d1-445c-9ae5-58d15543bbe4'::uuid,
  'Contrato de Comisión Mercantil',
  'docx_variables',
  'https://yxzchnldmfsgdtbjurey.supabase.co/storage/v1/object/public/documents-bucket/templates/558a7616-98d1-445c-9ae5-58d15543bbe4/docx-template-example-commission-es.docx',
  'https://yxzchnldmfsgdtbjurey.supabase.co/storage/v1/object/public/documents-bucket/templates/558a7616-98d1-445c-9ae5-58d15543bbe4/docx-template-example-commission-es.docx',
  '[{"key":"fecha_contrato","label":"Fecha","type":"text","required":true},{"key":"ciudad_contrato","label":"Ciudad","type":"text","required":true},{"key":"nombre_comitente","label":"Razón social o nombre","type":"text","required":true},{"key":"identificacion_comitente","label":"Identificación/NIT","type":"text","required":true},{"key":"direccion_comitente","label":"Dirección","type":"text","required":true},{"key":"telefono_comitente","label":"Teléfono","type":"text","required":true},{"key":"nombre_comisionista","label":"Nombre completo","type":"text","required":true},{"key":"identificacion_comisionista","label":"Identificación","type":"text","required":true},{"key":"direccion_comisionista","label":"Dirección","type":"text","required":true},{"key":"telefono_comisionista","label":"Teléfono","type":"text","required":true},{"key":"correo_comisionista","label":"Correo","type":"text","required":true},{"key":"productos_comercializar","label":"Producto(s) o servicio(s) a comercializar","type":"text","required":true},{"key":"territorio_comision","label":"Territorio asignado","type":"text","required":true},{"key":"porcentaje_comision","label":"Porcentaje de comisión","type":"text","required":true},{"key":"forma_pago_comision","label":"Forma de pago de la comisión","type":"text","required":true},{"key":"fecha_inicio_comision","label":"Fecha de inicio","type":"text","required":true},{"key":"duracion_comision","label":"Duración","type":"text","required":true}]'::jsonb,
  '[{"role":"variable","label":"Firmante 1"}]'::jsonb,
  '{"requireSelfie":false,"requireSmsOtp":false,"requireIdPhoto":false,"requireBiometric":false,"standardSignature":true,"advancedAuditTrail":false,"requireEsignConsent":false}'::jsonb,
  true,
  'Contrato de Comisión Mercantil - Plantilla de Ejemplo (Ventas y Distribución)',
  'Completa los datos del comitente, el comisionista, el territorio asignado y las condiciones económicas de la comisión.',
  ''
);

INSERT INTO public.templates (
  user_id, name, kind, file_url, docx_file_url, detected_fields, signers, security_config,
  is_public_example, example_label, instructions_es, instructions_en
) VALUES (
  '558a7616-98d1-445c-9ae5-58d15543bbe4'::uuid,
  'Contrato de Franquicia',
  'docx_variables',
  'https://yxzchnldmfsgdtbjurey.supabase.co/storage/v1/object/public/documents-bucket/templates/558a7616-98d1-445c-9ae5-58d15543bbe4/docx-template-example-franchise-es.docx',
  'https://yxzchnldmfsgdtbjurey.supabase.co/storage/v1/object/public/documents-bucket/templates/558a7616-98d1-445c-9ae5-58d15543bbe4/docx-template-example-franchise-es.docx',
  '[{"key":"fecha_contrato","label":"Fecha","type":"text","required":true},{"key":"ciudad_contrato","label":"Ciudad","type":"text","required":true},{"key":"razon_social_franquiciante","label":"Razón social","type":"text","required":true},{"key":"nit_franquiciante","label":"NIT","type":"text","required":true},{"key":"representante_franquiciante","label":"Representante legal","type":"text","required":true},{"key":"direccion_franquiciante","label":"Dirección","type":"text","required":true},{"key":"telefono_franquiciante","label":"Teléfono","type":"text","required":true},{"key":"nombre_franquiciado","label":"Nombre o razón social","type":"text","required":true},{"key":"identificacion_franquiciado","label":"Identificación/NIT","type":"text","required":true},{"key":"direccion_franquiciado","label":"Dirección","type":"text","required":true},{"key":"telefono_franquiciado","label":"Teléfono","type":"text","required":true},{"key":"correo_franquiciado","label":"Correo","type":"text","required":true},{"key":"marca_franquicia","label":"Marca","type":"text","required":true},{"key":"ubicacion_establecimiento","label":"Ubicación del establecimiento","type":"text","required":true},{"key":"territorio_asignado","label":"Territorio asignado","type":"text","required":true},{"key":"cuota_inicial_franquicia","label":"Cuota inicial de franquicia","type":"text","required":true},{"key":"regalias_mensuales","label":"Regalías mensuales","type":"text","required":true},{"key":"aporte_publicidad","label":"Aporte a fondo de publicidad","type":"text","required":true},{"key":"fecha_inicio_franquicia","label":"Fecha de inicio","type":"text","required":true},{"key":"duracion_franquicia","label":"Duración","type":"text","required":true}]'::jsonb,
  '[{"role":"variable","label":"Firmante 1"}]'::jsonb,
  '{"requireSelfie":false,"requireSmsOtp":false,"requireIdPhoto":false,"requireBiometric":false,"standardSignature":true,"advancedAuditTrail":false,"requireEsignConsent":false}'::jsonb,
  true,
  'Contrato de Franquicia - Plantilla de Ejemplo (Franquicias y Marcas)',
  'Completa los datos del franquiciante, el franquiciado, la marca y las condiciones económicas de la franquicia.',
  ''
);

INSERT INTO public.templates (
  user_id, name, kind, file_url, docx_file_url, detected_fields, signers, security_config,
  is_public_example, example_label, instructions_es, instructions_en
) VALUES (
  '558a7616-98d1-445c-9ae5-58d15543bbe4'::uuid,
  'Contrato de Prestación de Servicios de Selección de Personal',
  'docx_variables',
  'https://yxzchnldmfsgdtbjurey.supabase.co/storage/v1/object/public/documents-bucket/templates/558a7616-98d1-445c-9ae5-58d15543bbe4/docx-template-example-hr-es.docx',
  'https://yxzchnldmfsgdtbjurey.supabase.co/storage/v1/object/public/documents-bucket/templates/558a7616-98d1-445c-9ae5-58d15543bbe4/docx-template-example-hr-es.docx',
  '[{"key":"fecha_contrato","label":"Fecha","type":"text","required":true},{"key":"ciudad_contrato","label":"Ciudad","type":"text","required":true},{"key":"razon_social_agencia","label":"Razón social","type":"text","required":true},{"key":"nit_agencia","label":"NIT","type":"text","required":true},{"key":"representante_agencia","label":"Representante legal","type":"text","required":true},{"key":"direccion_agencia","label":"Dirección","type":"text","required":true},{"key":"telefono_agencia","label":"Teléfono","type":"text","required":true},{"key":"razon_social_empresa","label":"Razón social","type":"text","required":true},{"key":"nit_empresa","label":"NIT","type":"text","required":true},{"key":"representante_empresa","label":"Representante legal","type":"text","required":true},{"key":"direccion_empresa","label":"Dirección","type":"text","required":true},{"key":"telefono_empresa","label":"Teléfono","type":"text","required":true},{"key":"cargos_a_cubrir","label":"Cargo(s) a cubrir","type":"text","required":true},{"key":"numero_vacantes","label":"Número de vacantes","type":"text","required":true},{"key":"perfil_requerido","label":"Perfil requerido","type":"text","required":true},{"key":"valor_servicio","label":"Valor del servicio","type":"text","required":true},{"key":"forma_pago_servicio","label":"Forma de pago","type":"text","required":true},{"key":"plazo_garantia","label":"Plazo de garantía de reemplazo","type":"text","required":true},{"key":"fecha_inicio_servicio","label":"Fecha de inicio","type":"text","required":true},{"key":"fecha_fin_servicio","label":"Fecha de finalización","type":"text","required":true}]'::jsonb,
  '[{"role":"variable","label":"Firmante 1"}]'::jsonb,
  '{"requireSelfie":false,"requireSmsOtp":false,"requireIdPhoto":false,"requireBiometric":false,"standardSignature":true,"advancedAuditTrail":false,"requireEsignConsent":false}'::jsonb,
  true,
  'Selección de Personal - Plantilla de Ejemplo (Recursos Humanos)',
  'Completa los datos de la agencia de empleo, la empresa contratante, el cargo a cubrir y las condiciones del servicio.',
  ''
);

INSERT INTO public.templates (
  user_id, name, kind, file_url, docx_file_url, detected_fields, signers, security_config,
  is_public_example, example_label, instructions_es, instructions_en
) VALUES (
  '558a7616-98d1-445c-9ae5-58d15543bbe4'::uuid,
  'Contrato de Corretaje de Seguros',
  'docx_variables',
  'https://yxzchnldmfsgdtbjurey.supabase.co/storage/v1/object/public/documents-bucket/templates/558a7616-98d1-445c-9ae5-58d15543bbe4/docx-template-example-insurance-es.docx',
  'https://yxzchnldmfsgdtbjurey.supabase.co/storage/v1/object/public/documents-bucket/templates/558a7616-98d1-445c-9ae5-58d15543bbe4/docx-template-example-insurance-es.docx',
  '[{"key":"fecha_contrato","label":"Fecha","type":"text","required":true},{"key":"ciudad_contrato","label":"Ciudad","type":"text","required":true},{"key":"razon_social_corredor","label":"Razón social","type":"text","required":true},{"key":"nit_corredor","label":"NIT","type":"text","required":true},{"key":"representante_corredor","label":"Representante legal","type":"text","required":true},{"key":"direccion_corredor","label":"Dirección","type":"text","required":true},{"key":"telefono_corredor","label":"Teléfono","type":"text","required":true},{"key":"nombre_cliente","label":"Nombre completo","type":"text","required":true},{"key":"identificacion_cliente","label":"Identificación","type":"text","required":true},{"key":"direccion_cliente","label":"Dirección","type":"text","required":true},{"key":"telefono_cliente","label":"Teléfono","type":"text","required":true},{"key":"correo_cliente","label":"Correo","type":"text","required":true},{"key":"tipo_poliza","label":"Tipo de póliza a gestionar","type":"text","required":true},{"key":"aseguradora","label":"Compañía aseguradora","type":"text","required":true},{"key":"bien_asegurado","label":"Bien o riesgo asegurado","type":"text","required":true},{"key":"valor_prima","label":"Valor de la prima","type":"text","required":true},{"key":"comision_corredor","label":"Comisión del corredor","type":"text","required":true},{"key":"fecha_inicio_poliza","label":"Fecha de inicio","type":"text","required":true},{"key":"fecha_vencimiento_poliza","label":"Fecha de vencimiento","type":"text","required":true}]'::jsonb,
  '[{"role":"variable","label":"Firmante 1"}]'::jsonb,
  '{"requireSelfie":false,"requireSmsOtp":false,"requireIdPhoto":false,"requireBiometric":false,"standardSignature":true,"advancedAuditTrail":false,"requireEsignConsent":false}'::jsonb,
  true,
  'Corretaje de Seguros - Plantilla de Ejemplo (Seguros)',
  'Completa los datos del corredor, el cliente, la póliza y las condiciones de la intermediación.',
  ''
);

INSERT INTO public.templates (
  user_id, name, kind, file_url, docx_file_url, detected_fields, signers, security_config,
  is_public_example, example_label, instructions_es, instructions_en
) VALUES (
  '558a7616-98d1-445c-9ae5-58d15543bbe4'::uuid,
  'Contrato de Arrendamiento de Inmueble',
  'docx_variables',
  'https://yxzchnldmfsgdtbjurey.supabase.co/storage/v1/object/public/documents-bucket/templates/558a7616-98d1-445c-9ae5-58d15543bbe4/docx-template-example-real-estate-es.docx',
  'https://yxzchnldmfsgdtbjurey.supabase.co/storage/v1/object/public/documents-bucket/templates/558a7616-98d1-445c-9ae5-58d15543bbe4/docx-template-example-real-estate-es.docx',
  '[{"key":"fecha_contrato","label":"Fecha","type":"text","required":true},{"key":"ciudad_contrato","label":"Ciudad","type":"text","required":true},{"key":"nombre_arrendador","label":"Nombre completo","type":"text","required":true},{"key":"identificacion_arrendador","label":"Identificación","type":"text","required":true},{"key":"direccion_arrendador","label":"Dirección","type":"text","required":true},{"key":"telefono_arrendador","label":"Teléfono","type":"text","required":true},{"key":"correo_arrendador","label":"Correo","type":"text","required":true},{"key":"nombre_arrendatario","label":"Nombre completo","type":"text","required":true},{"key":"identificacion_arrendatario","label":"Identificación","type":"text","required":true},{"key":"direccion_arrendatario","label":"Dirección","type":"text","required":true},{"key":"telefono_arrendatario","label":"Teléfono","type":"text","required":true},{"key":"correo_arrendatario","label":"Correo","type":"text","required":true},{"key":"direccion_inmueble","label":"Dirección del inmueble","type":"text","required":true},{"key":"tipo_inmueble","label":"Tipo de inmueble","type":"text","required":true},{"key":"destinacion_inmueble","label":"Destinación","type":"text","required":true},{"key":"matricula_inmobiliaria","label":"Matrícula inmobiliaria","type":"text","required":true},{"key":"canon_arrendamiento","label":"Canon de arrendamiento mensual","type":"text","required":true},{"key":"forma_pago_canon","label":"Forma de pago","type":"text","required":true},{"key":"deposito_garantia","label":"Depósito de garantía","type":"text","required":true},{"key":"dia_pago_canon","label":"Día de pago","type":"text","required":true},{"key":"fecha_inicio_contrato","label":"Fecha de inicio","type":"text","required":true},{"key":"fecha_fin_contrato","label":"Fecha de terminación","type":"text","required":true}]'::jsonb,
  '[{"role":"variable","label":"Firmante 1"}]'::jsonb,
  '{"requireSelfie":false,"requireSmsOtp":false,"requireIdPhoto":false,"requireBiometric":false,"standardSignature":true,"advancedAuditTrail":false,"requireEsignConsent":false}'::jsonb,
  true,
  'Arrendamiento de Inmueble - Plantilla de Ejemplo (Inmobiliario)',
  'Completa los datos del arrendador, el arrendatario, el inmueble y las condiciones económicas del arriendo.',
  ''
);

INSERT INTO public.templates (
  user_id, name, kind, file_url, docx_file_url, detected_fields, signers, security_config,
  is_public_example, example_label, instructions_es, instructions_en
) VALUES (
  '558a7616-98d1-445c-9ae5-58d15543bbe4'::uuid,
  'Contrato de Compraventa de Vehículo',
  'docx_variables',
  'https://yxzchnldmfsgdtbjurey.supabase.co/storage/v1/object/public/documents-bucket/templates/558a7616-98d1-445c-9ae5-58d15543bbe4/docx-template-example-vehicle-es.docx',
  'https://yxzchnldmfsgdtbjurey.supabase.co/storage/v1/object/public/documents-bucket/templates/558a7616-98d1-445c-9ae5-58d15543bbe4/docx-template-example-vehicle-es.docx',
  '[{"key":"fecha_contrato","label":"Fecha","type":"text","required":true},{"key":"ciudad_contrato","label":"Ciudad","type":"text","required":true},{"key":"nombre_vendedor","label":"Nombre completo","type":"text","required":true},{"key":"identificacion_vendedor","label":"Identificación","type":"text","required":true},{"key":"direccion_vendedor","label":"Dirección","type":"text","required":true},{"key":"telefono_vendedor","label":"Teléfono","type":"text","required":true},{"key":"correo_vendedor","label":"Correo","type":"text","required":true},{"key":"nombre_comprador","label":"Nombre completo","type":"text","required":true},{"key":"identificacion_comprador","label":"Identificación","type":"text","required":true},{"key":"direccion_comprador","label":"Dirección","type":"text","required":true},{"key":"telefono_comprador","label":"Teléfono","type":"text","required":true},{"key":"correo_comprador","label":"Correo","type":"text","required":true},{"key":"marca_vehiculo","label":"Marca","type":"text","required":true},{"key":"linea_vehiculo","label":"Línea","type":"text","required":true},{"key":"modelo_vehiculo","label":"Modelo","type":"text","required":true},{"key":"placa_vehiculo","label":"Placa","type":"text","required":true},{"key":"color_vehiculo","label":"Color","type":"text","required":true},{"key":"numero_motor","label":"Número de motor","type":"text","required":true},{"key":"numero_chasis","label":"Número de chasis","type":"text","required":true},{"key":"kilometraje_vehiculo","label":"Kilometraje","type":"text","required":true},{"key":"precio_venta","label":"Precio de venta","type":"text","required":true},{"key":"forma_pago","label":"Forma de pago","type":"text","required":true},{"key":"cuota_inicial","label":"Valor de la cuota inicial","type":"text","required":true},{"key":"fecha_entrega","label":"Fecha de entrega del vehículo","type":"text","required":true}]'::jsonb,
  '[{"role":"variable","label":"Firmante 1"}]'::jsonb,
  '{"requireSelfie":false,"requireSmsOtp":false,"requireIdPhoto":false,"requireBiometric":false,"standardSignature":true,"advancedAuditTrail":false,"requireEsignConsent":false}'::jsonb,
  true,
  'Compraventa de Vehículo - Plantilla de Ejemplo (Vehículos)',
  'Completa los datos del vendedor, el comprador, el vehículo y las condiciones de pago.',
  ''
);
