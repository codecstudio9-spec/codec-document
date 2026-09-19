// Supabase Edge Function — punto de conexión para firmar con Certicámara
// (certificado digital, no la firma electrónica simple que ya existe).
//
// ESTADO: infraestructura lista, integración real PENDIENTE. No tengo la
// documentación de la API de Certicámara (endpoints, forma del payload,
// método de autenticación, formato de respuesta) — cada proveedor de
// firma digital tiene su propio contrato, y inventar uno aquí sería
// activamente engañoso. Lo que SÍ está resuelto:
//   - Dónde vive la API key: tabla admin_secrets (nunca app_settings —
//     esa es de lectura pública), bajo la clave 'CERTICAMARA_API_KEY'.
//     Se administra desde el panel (ver CerticamaraSettings.tsx), nunca
//     por variable de entorno — el admin la pega y la actualiza él mismo.
//   - Cuándo se activa: esta función revisa admin_secrets primero; si no
//     hay nada guardado, responde 503 con un mensaje claro en vez de
//     fallar de forma confusa más adelante.
//   - Cómo el cliente sabe si está disponible: certicamara-service.ts
//     llama a la RPC admin_get_secret_status (nunca a esta función) para
//     decidir si mostrar la opción "Firma digital certificada" habilitada.
//
// CUANDO LLEGUE LA DOCUMENTACIÓN DE CERTICÁMARA, completar aquí:
//   1. La URL real de su API (reemplazar CERTICAMARA_API_BASE_URL_TODO).
//   2. El header/método de autenticación real (Bearer? API key en header
//      custom? Certificado mTLS? — leer su documentación).
//   3. La forma del payload que espera (probablemente: hash del PDF,
//      datos del firmante — cédula, nombre —, callback/redirect URL).
//   4. Qué devuelve — normalmente un ID de transacción de firma y/o una
//      URL a la que redirigir al firmante para completar la firma en la
//      plataforma de Certicámara (muchos proveedores de firma digital en
//      Colombia firman en SU propia plataforma, no vía API pura — hay
//      que confirmar cuál es el flujo real de Certicámara).
//
// Deploy:
//   supabase functions deploy certicamara-sign --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Se requiere iniciar sesión.' }), {
        status: 401, headers: corsHeaders(origin),
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida.' }), {
        status: 401, headers: corsHeaders(origin),
      });
    }

    // Lee la API key directamente de admin_secrets con la service-role
    // key (bypassa RLS) — nunca desde Deno.env, porque el admin la
    // administra desde el panel, no por variable de entorno.
    const { data: secretRow } = await admin
      .from('admin_secrets')
      .select('value')
      .eq('key', 'CERTICAMARA_API_KEY')
      .maybeSingle();

    const certicamaraApiKey = secretRow?.value;
    if (!certicamaraApiKey) {
      return new Response(JSON.stringify({
        error: 'La firma con Certicámara todavía no está activada. Pega tu API key en Configuración → Certicámara.',
        code: 'CERTICAMARA_NOT_CONFIGURED',
      }), { status: 503, headers: corsHeaders(origin) });
    }

    // ── A partir de aquí es donde va la integración real ────────────────
    // Placeholder deliberado: no se inventa una respuesta falsa de éxito.
    // Hasta tener la documentación real de Certicámara, esto es lo único
    // honesto que puede responder — "la clave está guardada, pero el
    // llamado real a su API todavía no está implementado".
    return new Response(JSON.stringify({
      error: 'La API key de Certicámara ya está guardada, pero la integración con su servicio real todavía no está implementada — falta su documentación de API (endpoints, formato de firma). Avisa cuando la tengas para completar esta función.',
      code: 'CERTICAMARA_INTEGRATION_PENDING',
    }), { status: 501, headers: corsHeaders(origin) });
  } catch (err) {
    console.error('[certicamara-sign] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'Error inesperado' }), {
      status: 500,
      headers: corsHeaders(origin),
    });
  }
});
