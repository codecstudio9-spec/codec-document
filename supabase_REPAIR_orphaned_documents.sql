-- ============================================================
-- CODEC DOCUMENT — Repara los 10 documentos huérfanos (original_pdf_url
-- vacío) confirmados por el diagnóstico del bug ya corregido.
-- Ejecutar en https://yxzchnldmfsgdtbjurey.supabase.co -> SQL Editor
--
-- El archivo PDF sí se subió correctamente a Storage en cada caso — lo
-- único que fallaba en silencio era el UPDATE que guarda esa URL en la
-- fila de `documents` (ya corregido). La ruta de almacenamiento es
-- predecible (documents/{document_id}/original.pdf), así que se puede
-- reconstruir la URL pública directamente sin volver a subir nada.
--
-- IMPORTANTE: esto asume que el archivo SÍ existe en el bucket
-- 'documents-bucket' bajo esa ruta. Si alguno de estos 10 documentos
-- falló también en el paso de subida (poco probable, pero posible),
-- la URL reconstruida apuntaría a un archivo inexistente (404 al
-- abrirla). Verifica al menos 1 o 2 en el navegador después de correr
-- esto para confirmar que sí abren.
-- ============================================================

UPDATE public.documents
SET original_pdf_url = 'https://yxzchnldmfsgdtbjurey.supabase.co/storage/v1/object/public/documents-bucket/documents/' || id || '/original.pdf'
WHERE id IN (
  '9a91d608-602b-4759-8b08-e9d6da113983',
  '89469a73-a2f3-4745-a944-5c67dbbfdc4f',
  '7afc432a-c4c0-4728-b85b-fdd8d402465a',
  'b40a0ec2-b646-4c58-a461-3f9ebfd5f58c',
  '513ded92-5d35-49b9-88cd-68346583bf79',
  'f0b1135c-5a52-4cc8-880e-9524ff2d55f6',
  'cffe1430-8d65-42c7-b39e-c49d048abf36',
  'fe9b3455-dfbb-4e22-846e-770a2a3ca241',
  '0420eef6-53ca-47cf-a2ef-cc11f17f57ae',
  'dd0c5fa2-7e4b-42d6-87d0-9b4401425a92'
)
AND (original_pdf_url IS NULL OR original_pdf_url = '');

-- Verificación: debe mostrar las 10 filas ya con su URL reconstruida.
SELECT id, name, status, original_pdf_url, created_at
FROM public.documents
WHERE id IN (
  '9a91d608-602b-4759-8b08-e9d6da113983',
  '89469a73-a2f3-4745-a944-5c67dbbfdc4f',
  '7afc432a-c4c0-4728-b85b-fdd8d402465a',
  'b40a0ec2-b646-4c58-a461-3f9ebfd5f58c',
  '513ded92-5d35-49b9-88cd-68346583bf79',
  'f0b1135c-5a52-4cc8-880e-9524ff2d55f6',
  'cffe1430-8d65-42c7-b39e-c49d048abf36',
  'fe9b3455-dfbb-4e22-846e-770a2a3ca241',
  '0420eef6-53ca-47cf-a2ef-cc11f17f57ae',
  'dd0c5fa2-7e4b-42d6-87d0-9b4401425a92'
)
ORDER BY created_at DESC;
