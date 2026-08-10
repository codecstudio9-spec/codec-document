-- Motor de documentos electrónicos DIAN — Fase 2: modelo de datos.
--
-- Guarda lo que produce el parser de src/lib/dian/parser.ts (ver el tipo
-- DocumentoNormalizado en src/lib/dian/types.ts). Prefijo ed_ para que no
-- se mezcle visualmente con el esquema de firmas ya existente.
--
-- ── Aislamiento ─────────────────────────────────────────────────────────
-- Cada fila lleva owner_user_id (siempre) y company_id (cuando el usuario
-- pertenece a una empresa). Se sigue el mismo patrón ya usado en
-- sign_transactions/templates: DEFAULT public.get_my_company_id(), que es
-- STABLE y SECURITY DEFINER, así que rellena el tenant sin que el cliente
-- lo mande y sin recursión de RLS al consultar company_members.
--
-- Un contador independiente (sin empresa) queda con company_id NULL y ve
-- lo suyo por owner_user_id. Un owner/admin de empresa ve además todo lo
-- de su equipo. Nadie ve nunca lo de otra empresa.
--
-- ── Un contador administra varios NIT ───────────────────────────────────
-- fiscal_entities son los NIT que la firma administra (sus clientes). NO
-- son companies: convertir cada cliente en una empresa rompería
-- facturación, dominio de correo y get_my_company_id(). Los documentos se
-- aíslan por company_id/owner_user_id (seguridad) y se organizan por
-- fiscal_entity_id (negocio).

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Entidades fiscales — los NIT que administra la firma
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.fiscal_entities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id      uuid REFERENCES public.companies(id),
  nit             text NOT NULL,
  dv              text,
  razon_social    text NOT NULL,
  nombre_comercial text,
  regimen         text,
  country         text NOT NULL DEFAULT 'CO',
  activo          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fiscal_entities ALTER COLUMN company_id SET DEFAULT public.get_my_company_id();

-- Un mismo NIT no se registra dos veces bajo el mismo dueño.
CREATE UNIQUE INDEX IF NOT EXISTS fiscal_entities_owner_nit_idx
  ON public.fiscal_entities (owner_user_id, nit);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Importaciones — la fila que escucha el frontend por Realtime
-- ═══════════════════════════════════════════════════════════════════════
--
-- Los contadores se actualizan por lote (cada ~50 documentos o 2 s), no por
-- documento: emitir un evento por cada uno de 5.000 inundaría el canal y
-- quemaría cuota sin que el ojo humano note la diferencia.

CREATE TABLE IF NOT EXISTS public.ed_imports (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id        uuid REFERENCES public.companies(id),
  fiscal_entity_id  uuid REFERENCES public.fiscal_entities(id) ON DELETE SET NULL,

  -- De dónde vinieron los documentos.
  source            text NOT NULL DEFAULT 'zip'
                    CHECK (source IN ('zip', 'xml', 'excel_dian', 'email', 'dian_token', 'api')),
  source_ref        text,
  storage_path      text,

  -- Estados internos. La interfaz los traduce a lenguaje humano
  -- ("Leyendo la información…"), nunca los muestra tal cual.
  status            text NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','RUNNING','PAUSED_AUTH','THROTTLED',
                                      'COMPLETED','PARTIAL','FAILED','CANCELLED')),
  phase             text NOT NULL DEFAULT 'QUEUED'
                    CHECK (phase IN ('QUEUED','CONNECTING','DISCOVERING','DOWNLOADING',
                                     'PARSING','VALIDATING','CLASSIFYING','DONE')),

  total_found       integer NOT NULL DEFAULT 0,
  downloaded        integer NOT NULL DEFAULT 0,
  processed         integer NOT NULL DEFAULT 0,
  duplicates        integer NOT NULL DEFAULT 0,
  review            integer NOT NULL DEFAULT 0,
  errors            integer NOT NULL DEFAULT 0,

  -- Conteo por tipo, para las tarjetas del dashboard sin recorrer documentos.
  by_type           jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Últimos documentos procesados: lista corta y rotatoria para el feed en
  -- vivo. No es historial — el historial son las filas de ed_import_items.
  recent            jsonb NOT NULL DEFAULT '[]'::jsonb,

  error_message     text,
  started_at        timestamptz,
  finished_at       timestamptz,
  -- Los paquetes de descarga se purgan a los 40 días; el XML normalizado no.
  expires_at        timestamptz NOT NULL DEFAULT (now() + interval '40 days'),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ed_imports ALTER COLUMN company_id SET DEFAULT public.get_my_company_id();

CREATE INDEX IF NOT EXISTS ed_imports_owner_idx ON public.ed_imports (owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ed_imports_company_idx ON public.ed_imports (company_id, created_at DESC) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ed_imports_activas_idx ON public.ed_imports (status) WHERE status IN ('PENDING','RUNNING','THROTTLED');

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Cola de trabajo
-- ═══════════════════════════════════════════════════════════════════════
--
-- No hace falta Redis ni SQS: la cola es esta tabla y el reclamo es un
-- FOR UPDATE SKIP LOCKED (ver ed_claim_batch más abajo).

CREATE TABLE IF NOT EXISTS public.ed_import_items (
  id             bigserial PRIMARY KEY,
  import_id      uuid NOT NULL REFERENCES public.ed_imports(id) ON DELETE CASCADE,
  owner_user_id  uuid NOT NULL,
  company_id     uuid,

  file_name      text,
  storage_path   text,
  -- Identificador de origen: el CUFE cuando se descarga por lista de CUFEs.
  source_key     text,
  sha256         text,

  status         text NOT NULL DEFAULT 'PENDING'
                 CHECK (status IN ('PENDING','PROCESSING','PROCESSED','DUPLICATE',
                                   'REVIEW_REQUIRED','INVALID','ERROR','CANCELLED')),
  attempts       smallint NOT NULL DEFAULT 0,
  claimed_at     timestamptz,
  error_code     text,
  error_detail   text,
  document_id    uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Índice parcial: el reclamo sólo mira los pendientes, que son una fracción
-- decreciente de la tabla a medida que avanza la importación.
CREATE INDEX IF NOT EXISTS ed_import_items_pendientes_idx
  ON public.ed_import_items (import_id, id) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS ed_import_items_import_idx ON public.ed_import_items (import_id, status);
-- Para devolver a PENDING lo que quedó reclamado por un worker que murió.
CREATE INDEX IF NOT EXISTS ed_import_items_colgados_idx
  ON public.ed_import_items (claimed_at) WHERE status = 'PROCESSING';

-- ═══════════════════════════════════════════════════════════════════════
-- 4. Terceros deduplicados
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ed_parties (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id  uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id     uuid REFERENCES public.companies(id),
  nit            text NOT NULL,
  dv             text,
  razon_social   text,
  nombre_comercial text,
  regimen        text,
  ciudad         text,
  departamento   text,
  email          text,
  telefono       text,
  -- Gancho para la fase contable: la cuenta que suele usarse con este
  -- tercero. Se deja preparado, no se usa todavía.
  cuenta_sugerida text,
  first_seen_at  timestamptz NOT NULL DEFAULT now(),
  last_seen_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ed_parties ALTER COLUMN company_id SET DEFAULT public.get_my_company_id();

CREATE UNIQUE INDEX IF NOT EXISTS ed_parties_owner_nit_idx ON public.ed_parties (owner_user_id, nit);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. Documentos
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ed_documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id        uuid REFERENCES public.companies(id),
  fiscal_entity_id  uuid REFERENCES public.fiscal_entities(id) ON DELETE SET NULL,
  import_id         uuid REFERENCES public.ed_imports(id) ON DELETE SET NULL,

  doc_type          text NOT NULL DEFAULT 'desconocido'
                    CHECK (doc_type IN ('factura','nota_credito','nota_debito',
                                        'documento_equivalente','documento_soporte',
                                        'nomina','evento','desconocido')),
  -- Código crudo de la DIAN (01, 04, 91, 92…), por si el tipo se afina
  -- después sin volver a leer el XML.
  doc_type_code     text,
  direction         text NOT NULL DEFAULT 'desconocido'
                    CHECK (direction IN ('recibido','emitido','desconocido')),

  cufe              text,
  cufe_scheme       text,
  prefix            text,
  number            text,
  full_number       text,

  issue_date        date,
  issue_time        text,
  due_date          date,

  currency          text NOT NULL DEFAULT 'COP',
  payment_form      text,
  payment_method    text,

  issuer_nit        text,
  issuer_dv         text,
  issuer_name       text,
  issuer_trade_name text,
  issuer_party_id   uuid REFERENCES public.ed_parties(id) ON DELETE SET NULL,

  receiver_nit      text,
  receiver_dv       text,
  receiver_name     text,
  receiver_party_id uuid REFERENCES public.ed_parties(id) ON DELETE SET NULL,

  -- ── Totales ──────────────────────────────────────────────────────────
  -- line_total es LineExtensionAmount (el "subtotal" que reconoce un
  -- contador). taxable_base es TaxExclusiveAmount, que NO es lo mismo: es
  -- sólo la porción gravada. Una línea excluida de IVA suma en el primero
  -- y no aparece en el segundo. Confundirlos hace que toda factura que
  -- mezcle gravados y excluidos parezca descuadrada.
  line_total        numeric(18,2) NOT NULL DEFAULT 0,
  taxable_base      numeric(18,2) NOT NULL DEFAULT 0,
  tax_inclusive     numeric(18,2) NOT NULL DEFAULT 0,
  discounts         numeric(18,2) NOT NULL DEFAULT 0,
  charges           numeric(18,2) NOT NULL DEFAULT 0,
  prepaid           numeric(18,2) NOT NULL DEFAULT 0,
  rounding          numeric(18,2) NOT NULL DEFAULT 0,
  total             numeric(18,2) NOT NULL DEFAULT 0,

  -- ── Resumen de impuestos ─────────────────────────────────────────────
  -- Caché de lectura, calculado por el motor al guardar. La fuente de
  -- verdad es ed_document_taxes; esto existe para que las tarjetas del
  -- dashboard y las hojas del Excel salgan de una consulta con sumas en
  -- vez de recorrer millones de filas de impuestos.
  total_iva         numeric(18,2) NOT NULL DEFAULT 0,
  total_inc         numeric(18,2) NOT NULL DEFAULT 0,
  total_ica         numeric(18,2) NOT NULL DEFAULT 0,
  total_bolsas      numeric(18,2) NOT NULL DEFAULT 0,
  total_otros       numeric(18,2) NOT NULL DEFAULT 0,
  total_rete_renta  numeric(18,2) NOT NULL DEFAULT 0,
  total_rete_iva    numeric(18,2) NOT NULL DEFAULT 0,
  total_rete_ica    numeric(18,2) NOT NULL DEFAULT 0,
  total_impuestos   numeric(18,2) NOT NULL DEFAULT 0,
  total_retenciones numeric(18,2) NOT NULL DEFAULT 0,
  -- Base discriminada por tarifa de IVA: {"0":1000,"5":2000,"19":3000}.
  -- Es jsonb y no columnas fijas porque las tarifas cambian por norma.
  base_iva_por_tarifa jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- ── Autorización DIAN ────────────────────────────────────────────────
  dian_resolution   text,
  dian_valid_from   date,
  dian_valid_to     date,
  dian_range_from   text,
  dian_range_to     text,
  dian_provider_nit text,
  dian_software_id  text,
  dian_qr           text,
  dian_validated    boolean NOT NULL DEFAULT false,
  dian_validated_at date,

  notes             text[],
  reference_number  text,
  reference_cufe    text,
  reference_date    date,

  status            text NOT NULL DEFAULT 'PROCESSED'
                    CHECK (status IN ('PROCESSED','REVIEW_REQUIRED','INVALID','DUPLICATE','ERROR')),
  -- Gancho para la fase contable. No se usa todavía (ver regla 32).
  accounting_status text NOT NULL DEFAULT 'pendiente'
                    CHECK (accounting_status IN ('pendiente','sugerido','aprobado','exportado','omitido')),

  -- Cuando el parser mejore, esto dice qué documentos reprocesar sin
  -- volver a pedirle nada a la DIAN — que con token de 60 minutos y miles
  -- de documentos es una operación cara.
  engine_version    text NOT NULL DEFAULT '1.0.0',
  parse_ms          integer,
  processed_at      timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ed_documents ALTER COLUMN company_id SET DEFAULT public.get_my_company_id();

-- ── Deduplicación en tres niveles (requisito 16) ───────────────────────
-- 1) sha256 del archivo, en ed_document_files: mismo archivo byte a byte.
-- 2) CUFE: mismo documento llegado por otro archivo.
-- 3) emisor+tipo+prefijo+número: red de seguridad cuando falta el CUFE.
-- Se indexa por owner_user_id y no por fiscal_entity_id porque ésta puede
-- quedar NULL, y un índice único con NULL no agrupa.
CREATE UNIQUE INDEX IF NOT EXISTS ed_documents_cufe_idx
  ON public.ed_documents (owner_user_id, cufe) WHERE cufe IS NOT NULL AND cufe <> '';

CREATE UNIQUE INDEX IF NOT EXISTS ed_documents_numero_idx
  ON public.ed_documents (owner_user_id, issuer_nit, doc_type, prefix, number)
  WHERE (cufe IS NULL OR cufe = '') AND issuer_nit IS NOT NULL AND number IS NOT NULL;

-- Índices de la tabla y los filtros que pide el producto (empresa, periodo,
-- tipo, proveedor, NIT, estado, valor, fecha).
CREATE INDEX IF NOT EXISTS ed_documents_listado_idx
  ON public.ed_documents (owner_user_id, issue_date DESC, id DESC);
CREATE INDEX IF NOT EXISTS ed_documents_company_idx
  ON public.ed_documents (company_id, issue_date DESC) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ed_documents_entidad_idx
  ON public.ed_documents (fiscal_entity_id, issue_date DESC) WHERE fiscal_entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ed_documents_emisor_idx
  ON public.ed_documents (owner_user_id, issuer_nit, issue_date DESC);
CREATE INDEX IF NOT EXISTS ed_documents_estado_idx
  ON public.ed_documents (owner_user_id, status) WHERE status <> 'PROCESSED';
CREATE INDEX IF NOT EXISTS ed_documents_import_idx ON public.ed_documents (import_id);
-- Búsqueda por número tal como lo teclea el contador ("FE21570").
CREATE INDEX IF NOT EXISTS ed_documents_full_number_idx
  ON public.ed_documents (owner_user_id, full_number);

-- ═══════════════════════════════════════════════════════════════════════
-- 6. Líneas
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ed_document_lines (
  id               bigserial PRIMARY KEY,
  document_id      uuid NOT NULL REFERENCES public.ed_documents(id) ON DELETE CASCADE,
  owner_user_id    uuid NOT NULL,
  company_id       uuid,

  line_no          integer NOT NULL,
  seller_item_code text,
  standard_item_code text,
  description      text,
  note             text,
  quantity         numeric(18,6) NOT NULL DEFAULT 0,
  unit_code        text,
  unit_price       numeric(18,4) NOT NULL DEFAULT 0,
  discount         numeric(18,2) NOT NULL DEFAULT 0,
  charge           numeric(18,2) NOT NULL DEFAULT 0,
  line_total       numeric(18,2) NOT NULL DEFAULT 0,
  tax_total        numeric(18,2) NOT NULL DEFAULT 0,
  -- Ganchos contables, sin usar todavía.
  suggested_account text,
  cost_center       text
);

CREATE INDEX IF NOT EXISTS ed_document_lines_doc_idx ON public.ed_document_lines (document_id, line_no);
CREATE INDEX IF NOT EXISTS ed_document_lines_owner_idx ON public.ed_document_lines (owner_user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 7. Impuestos — fuente de verdad, genérica
-- ═══════════════════════════════════════════════════════════════════════
--
-- Una fila por impuesto. Un impuesto nuevo es una fila, NUNCA una
-- migración: el código se guarda tal cual venga del XML y el nombre
-- también. Ya se han visto en documentos reales códigos que no son un
-- impuesto concreto (ZZ "No aplica", ZA "IVA e INC") y entran sin caso
-- especial. Diseñar esto con columnas fijas por impuesto era el error
-- que habría obligado a rehacer la base con cada cambio normativo.

CREATE TABLE IF NOT EXISTS public.ed_document_taxes (
  id            bigserial PRIMARY KEY,
  document_id   uuid NOT NULL REFERENCES public.ed_documents(id) ON DELETE CASCADE,
  line_id       bigint REFERENCES public.ed_document_lines(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  company_id    uuid,

  scope         text NOT NULL DEFAULT 'document' CHECK (scope IN ('document','line')),
  line_no       integer,
  tax_code      text NOT NULL,
  tax_name      text,
  taxable_base  numeric(18,2) NOT NULL DEFAULT 0,
  rate          numeric(9,4) NOT NULL DEFAULT 0,
  amount        numeric(18,2) NOT NULL DEFAULT 0,
  is_withholding boolean NOT NULL DEFAULT false,
  -- Para impuestos por cantidad en vez de por tarifa (bolsas).
  units         numeric(18,4)
);

CREATE INDEX IF NOT EXISTS ed_document_taxes_doc_idx ON public.ed_document_taxes (document_id, scope);
CREATE INDEX IF NOT EXISTS ed_document_taxes_codigo_idx ON public.ed_document_taxes (owner_user_id, tax_code, scope);
-- La hoja "Reporte Retenciones" del Excel sale de aquí.
CREATE INDEX IF NOT EXISTS ed_document_taxes_retenciones_idx
  ON public.ed_document_taxes (owner_user_id, document_id) WHERE is_withholding;

-- ═══════════════════════════════════════════════════════════════════════
-- 8. Archivos originales
-- ═══════════════════════════════════════════════════════════════════════
--
-- El XML se conserva de forma permanente: es obligación legal del
-- adquiriente (art. 632 del E.T.) y es lo que permite reprocesar cuando el
-- parser mejore. El PDF NO se guarda — pesa unas 25 veces más y se
-- regenera desde el modelo normalizado.

CREATE TABLE IF NOT EXISTS public.ed_document_files (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   uuid REFERENCES public.ed_documents(id) ON DELETE CASCADE,
  import_id     uuid REFERENCES public.ed_imports(id) ON DELETE SET NULL,
  owner_user_id uuid NOT NULL DEFAULT auth.uid(),
  company_id    uuid,

  kind          text NOT NULL DEFAULT 'attached_document'
                CHECK (kind IN ('zip','attached_document','invoice','application_response','excel_dian')),
  storage_path  text NOT NULL,
  original_filename text,
  sha256        text NOT NULL,
  byte_size     bigint,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ed_document_files ALTER COLUMN company_id SET DEFAULT public.get_my_company_id();

-- Nivel 1 de deduplicación: el mismo archivo, byte a byte, no se guarda
-- dos veces para el mismo dueño.
CREATE UNIQUE INDEX IF NOT EXISTS ed_document_files_sha_idx
  ON public.ed_document_files (owner_user_id, sha256);
CREATE INDEX IF NOT EXISTS ed_document_files_doc_idx ON public.ed_document_files (document_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 9. Excepciones — la bandeja que el contador realmente revisa
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ed_exceptions (
  id            bigserial PRIMARY KEY,
  document_id   uuid REFERENCES public.ed_documents(id) ON DELETE CASCADE,
  import_id     uuid REFERENCES public.ed_imports(id) ON DELETE CASCADE,
  item_id       bigint REFERENCES public.ed_import_items(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  company_id    uuid,

  code          text NOT NULL,
  severity      text NOT NULL DEFAULT 'revision' CHECK (severity IN ('error','revision','aviso')),
  message       text NOT NULL,
  field         text,
  expected      text,
  found         text,

  resolved_at   timestamptz,
  resolved_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_note text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- El caso de uso central: "muéstrame sólo lo que requiere revisión".
CREATE INDEX IF NOT EXISTS ed_exceptions_pendientes_idx
  ON public.ed_exceptions (owner_user_id, created_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS ed_exceptions_doc_idx ON public.ed_exceptions (document_id);
CREATE INDEX IF NOT EXISTS ed_exceptions_import_idx ON public.ed_exceptions (import_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 10. Perfiles de exportación a software contable
-- ═══════════════════════════════════════════════════════════════════════
--
-- No se programan cinco exportadores: se programa uno, guiado por estas
-- filas. Agregar Siigo, Alegra, World Office o Helisa es cargar
-- configuración, no desplegar código. Helisa, por ejemplo, exige .xls de
-- Excel 97-2003 en vez de .xlsx.
-- Los perfiles del sistema (owner_user_id NULL) los ve todo el mundo; un
-- usuario puede además crear los suyos.

CREATE TABLE IF NOT EXISTS public.ed_export_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id    uuid REFERENCES public.companies(id),
  slug          text NOT NULL,
  name          text NOT NULL,
  target        text NOT NULL,
  file_format   text NOT NULL DEFAULT 'xlsx' CHECK (file_format IN ('xlsx','xls','csv','txt')),
  date_format   text NOT NULL DEFAULT 'YYYY-MM-DD',
  decimal_sep   text NOT NULL DEFAULT '.',
  -- Definición de columnas: [{header, source, transform, required}, …]
  columns       jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Reglas de validación previas a la carga: lo que el software destino
  -- rechazaría, se detecta antes y se le explica al contador.
  validations   jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_system     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ed_export_profiles_sistema_idx
  ON public.ed_export_profiles (slug) WHERE is_system;

-- ═══════════════════════════════════════════════════════════════════════
-- 11. Estado de los conectores
-- ═══════════════════════════════════════════════════════════════════════
--
-- El token de la DIAN dura 60 minutos y llega al correo del RUT tras una
-- acción humana: no hay forma de renovarlo sin el contador. Por eso se
-- guarda con su expiración y una importación larga pasa a PAUSED_AUTH en
-- vez de fallar. Contraseñas de la DIAN, nunca.

CREATE TABLE IF NOT EXISTS public.ed_connector_state (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id       uuid REFERENCES public.companies(id),
  fiscal_entity_id uuid REFERENCES public.fiscal_entities(id) ON DELETE CASCADE,
  connector        text NOT NULL CHECK (connector IN ('dian_token','email','manual')),

  token_encrypted  text,
  token_expires_at timestamptz,
  -- Cursor del conector de correo: hasta dónde se leyó el buzón.
  cursor           text,
  last_sync_at     timestamptz,
  last_error       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ed_connector_state ALTER COLUMN company_id SET DEFAULT public.get_my_company_id();

CREATE UNIQUE INDEX IF NOT EXISTS ed_connector_state_unico_idx
  ON public.ed_connector_state (owner_user_id, connector, COALESCE(fiscal_entity_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ═══════════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════════
--
-- Mismo patrón en todas: se ve lo propio, y un owner/admin de empresa ve
-- además lo de su equipo. get_my_company_id()/get_my_company_role() son
-- SECURITY DEFINER y evitan la recursión clásica de consultar
-- company_members desde su propia política.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'fiscal_entities','ed_imports','ed_import_items','ed_parties','ed_documents',
    'ed_document_lines','ed_document_taxes','ed_document_files','ed_exceptions',
    'ed_export_profiles','ed_connector_state'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_own', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR ALL
        USING (owner_user_id = auth.uid())
        WITH CHECK (owner_user_id = auth.uid())
    $f$, t || '_own', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_company_admin', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR SELECT
        USING (
          company_id IS NOT NULL
          AND company_id = public.get_my_company_id()
          AND public.get_my_company_role() IN ('owner','admin')
        )
    $f$, t || '_company_admin', t);
  END LOOP;
END $$;

-- Los perfiles de exportación del sistema son de lectura pública: son
-- configuración del producto (el layout que espera Siigo), no datos de
-- nadie.
DROP POLICY IF EXISTS ed_export_profiles_sistema_lectura ON public.ed_export_profiles;
CREATE POLICY ed_export_profiles_sistema_lectura ON public.ed_export_profiles
  FOR SELECT USING (is_system);

-- ═══════════════════════════════════════════════════════════════════════
-- Almacenamiento privado
-- ═══════════════════════════════════════════════════════════════════════
--
-- Bucket NUEVO y privado. documents-bucket es público (tiene
-- FOR SELECT USING (bucket_id = 'documents-bucket') sin más condición):
-- guardar ahí los XML fiscales sería exponer los datos tributarios de los
-- clientes del contador. El acceso es sólo por URL firmada de corta
-- duración; nunca getPublicUrl().
--
-- Convención de ruta: {owner_user_id}/{import_id}/{uuid}.xml — el primer
-- segmento es lo que verifica la política.

INSERT INTO storage.buckets (id, name, public)
VALUES ('fiscal-documents', 'fiscal-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS fiscal_documents_propio ON storage.objects;
CREATE POLICY fiscal_documents_propio ON storage.objects
  FOR ALL
  USING (bucket_id = 'fiscal-documents' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'fiscal-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ═══════════════════════════════════════════════════════════════════════
-- Cola: reclamo de lote
-- ═══════════════════════════════════════════════════════════════════════
--
-- FOR UPDATE SKIP LOCKED es todo el mecanismo: dos workers concurrentes
-- nunca toman el mismo ítem, sin Redis y sin lógica de bloqueo propia.

CREATE OR REPLACE FUNCTION public.ed_claim_batch(p_import_id uuid, p_limit integer DEFAULT 50)
RETURNS SETOF public.ed_import_items
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.ed_import_items
  SET status = 'PROCESSING', claimed_at = now(), attempts = attempts + 1, updated_at = now()
  WHERE id IN (
    SELECT i.id
    FROM public.ed_import_items i
    JOIN public.ed_imports imp ON imp.id = i.import_id
    WHERE i.import_id = p_import_id
      AND i.status = 'PENDING'
      -- El guardia va aquí dentro: la función es SECURITY DEFINER, así que
      -- sin esto un usuario podría reclamar el lote de otro pasando su
      -- import_id.
      AND (imp.owner_user_id = auth.uid()
           OR (imp.company_id IS NOT NULL
               AND imp.company_id = public.get_my_company_id()
               AND public.get_my_company_role() IN ('owner','admin')))
    ORDER BY i.id
    LIMIT greatest(1, least(p_limit, 500))
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$;

REVOKE ALL ON FUNCTION public.ed_claim_batch(uuid, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_claim_batch(uuid, integer) TO authenticated, service_role;

-- Devuelve a la cola lo que quedó reclamado por un worker que murió a
-- mitad. Sin esto, una importación se quedaría colgada para siempre.
CREATE OR REPLACE FUNCTION public.ed_requeue_stale(p_minutes integer DEFAULT 10)
RETURNS integer
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  WITH devueltos AS (
    UPDATE public.ed_import_items
    SET status = 'PENDING', claimed_at = NULL, updated_at = now()
    WHERE status = 'PROCESSING'
      AND claimed_at < now() - make_interval(mins => greatest(1, p_minutes))
      AND attempts < 3
    RETURNING 1
  )
  SELECT count(*)::integer FROM devueltos;
$$;

REVOKE ALL ON FUNCTION public.ed_requeue_stale(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_requeue_stale(integer) TO service_role;

-- ═══════════════════════════════════════════════════════════════════════
-- Purga
-- ═══════════════════════════════════════════════════════════════════════
--
-- Los paquetes de descarga son archivos temporales de conveniencia: 40
-- días. Las filas de la cola son bitácora de proceso: 90 días. El XML
-- normalizado y los documentos NO se purgan aquí — son obligación legal.
-- Programar con pg_cron una vez al día.

CREATE OR REPLACE FUNCTION public.ed_purge_expired()
RETURNS TABLE (imports_purgados integer, items_purgados integer)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_imports integer; v_items integer;
BEGIN
  -- Sólo se limpia la referencia al paquete, no la importación: el
  -- contador debe seguir viendo que ese día importó 5.284 documentos.
  UPDATE public.ed_imports
  SET storage_path = NULL
  WHERE storage_path IS NOT NULL AND expires_at < now();
  GET DIAGNOSTICS v_imports = ROW_COUNT;

  DELETE FROM public.ed_import_items
  WHERE created_at < now() - interval '90 days'
    AND status IN ('PROCESSED','DUPLICATE','CANCELLED');
  GET DIAGNOSTICS v_items = ROW_COUNT;

  RETURN QUERY SELECT v_imports, v_items;
END $$;

REVOKE ALL ON FUNCTION public.ed_purge_expired() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ed_purge_expired() TO service_role;

-- ═══════════════════════════════════════════════════════════════════════
-- Realtime
-- ═══════════════════════════════════════════════════════════════════════
--
-- SÓLO ed_imports. Publicar ed_documents haría que una importación de
-- 5.000 emitiera 5.000 eventos, inundando el canal y quemando cuota sin
-- que el ojo humano note la diferencia. El progreso viaja en una fila.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ed_imports;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
