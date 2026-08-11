-- Plantillas contables que aporta el propio contador.
--
-- El bloqueo anterior era que no teniamos los layouts de Siigo, Alegra,
-- World Office ni Helisa, y adivinarlos habria producido archivos que esos
-- programas rechazan -- peor que no tener la funcion. La solucion es que el
-- contador suba SU plantilla vacia: asi funciona con cualquier programa,
-- incluidos los que no conocemos.
--
-- Se guarda el archivo original en base64 dentro de la fila. Una plantilla
-- vacia pesa entre 5 y 30 KB, asi que 700 contadores son unos pocos MB --
-- menos de lo que costaria administrar politicas de un bucket aparte. Y hay
-- que conservar el archivo entero, no solo sus encabezados: puede traer
-- macros, formatos y hojas de catalogos que su programa necesita, y
-- reconstruirlo desde cero se los quitaria.

ALTER TABLE public.ed_export_profiles
  ADD COLUMN IF NOT EXISTS template_b64      text,
  ADD COLUMN IF NOT EXISTS template_filename text,
  -- Hoja donde se escriben los datos y fila donde estan los encabezados.
  -- Una plantilla real suele traer un titulo o instrucciones arriba, asi
  -- que la fila 1 no siempre es la de encabezados.
  ADD COLUMN IF NOT EXISTS sheet_path        text,
  ADD COLUMN IF NOT EXISTS sheet_name        text,
  ADD COLUMN IF NOT EXISTS header_row        integer NOT NULL DEFAULT 1,
  -- 'documento' = una fila por factura; 'linea' = una por producto.
  ADD COLUMN IF NOT EXISTS granularity       text NOT NULL DEFAULT 'documento'
    CHECK (granularity IN ('documento', 'linea'));

-- El indice unico existente solo cubre los perfiles del sistema. Los del
-- usuario se distinguen por dueño + slug, para que pueda tener uno de
-- Siigo y otro de Alegra sin chocar.
CREATE UNIQUE INDEX IF NOT EXISTS ed_export_profiles_usuario_idx
  ON public.ed_export_profiles (owner_user_id, slug)
  WHERE owner_user_id IS NOT NULL;

COMMENT ON COLUMN public.ed_export_profiles.columns IS
  'Emparejamiento columna->campo: [{columna, encabezado, campo, automatico}]. '
  'Se guarda para que el contador configure una sola vez y los meses '
  'siguientes solo elija el perfil y descargue.';
