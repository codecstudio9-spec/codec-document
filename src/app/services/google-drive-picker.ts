/**
 * "Elegir de Google Drive" — como el botón de Dropbox Sign al crear una
 * plantilla. Abre el selector oficial de Google (Google Picker), y el archivo
 * elegido se descarga en el navegador y entra al mismo flujo que un archivo
 * subido desde el computador.
 *
 * Permiso: `drive.file` — el más chico que existe. La app solo puede leer los
 * archivos que la persona elige en el selector, nunca el resto de su Drive, y
 * Google lo clasifica como no sensible (no exige verificación de la app).
 *
 * Usa el mismo OAuth Client ID del "Iniciar sesión con Google"
 * (VITE_GOOGLE_CLIENT_ID). En ese proyecto de Google Cloud tienen que estar
 * habilitadas la "Google Picker API" y la "Google Drive API", y el alcance
 * drive.file agregado a la pantalla de consentimiento. VITE_GOOGLE_API_KEY
 * (clave de navegador restringida al dominio) es opcional pero recomendada
 * por Google para el Picker.
 *
 * Un Google Docs se exporta a .docx; un .docx o .pdf se baja tal cual.
 */

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const MIME_GOOGLE_DOC = 'application/vnd.google-apps.document';
export const MIME_PDF = 'application/pdf';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing && existing.dataset.loaded === '1') { resolve(); return; }
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => { script.dataset.loaded = '1'; resolve(); }, { once: true });
    script.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)), { once: true });
    if (!existing) {
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    } else if ((window as Any).google?.accounts?.oauth2 && src.includes('gsi')) {
      // index.html ya lo cargó antes de que se registrara el listener.
      script.dataset.loaded = '1';
      resolve();
    }
  });
}

let pickerReady: Promise<void> | null = null;
function loadPicker(): Promise<void> {
  if (!pickerReady) {
    pickerReady = (async () => {
      await Promise.all([
        loadScript('https://accounts.google.com/gsi/client'),
        loadScript('https://apis.google.com/js/api.js'),
      ]);
      await new Promise<void>((resolve, reject) => {
        (window as Any).gapi.load('picker', { callback: resolve, onerror: () => reject(new Error('picker')) });
      });
    })().catch((err) => { pickerReady = null; throw err; });
  }
  return pickerReady;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

function getAccessToken(clientId: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return Promise.resolve(cachedToken.value);
  return new Promise((resolve, reject) => {
    const client = (window as Any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (resp: { access_token?: string; expires_in?: number; error?: string }) => {
        if (resp.error || !resp.access_token) { reject(new Error(resp.error || 'sin_token')); return; }
        cachedToken = { value: resp.access_token, expiresAt: Date.now() + (resp.expires_in ?? 3600) * 1000 };
        resolve(resp.access_token);
      },
      error_callback: (err: { type?: string }) => reject(new Error(err?.type === 'popup_closed' ? 'cancelado' : (err?.type || 'oauth'))),
    });
    client.requestAccessToken({ prompt: '' });
  });
}

async function descargar(token: string, doc: { id: string; name: string; mimeType: string }): Promise<File> {
  const esGoogleDoc = doc.mimeType === MIME_GOOGLE_DOC;
  const url = esGoogleDoc
    ? `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=${encodeURIComponent(MIME_DOCX)}`
    : `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media&supportsAllDrives=true`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Google Drive respondió ${res.status}`);
  const blob = await res.blob();
  const tipo = esGoogleDoc ? MIME_DOCX : doc.mimeType;
  const nombre = esGoogleDoc && !/\.docx$/i.test(doc.name) ? `${doc.name}.docx` : doc.name;
  return new File([blob], nombre, { type: tipo });
}

export function googleDriveDisponible(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

/**
 * Abre el selector de Google Drive y devuelve el archivo elegido, o null si
 * la persona lo cerró sin elegir. Lanza un Error con un mensaje para el
 * usuario si algo falla.
 */
export async function elegirArchivoDeDrive(opciones: {
  mimeTypes: string[];
  language: 'en' | 'es';
}): Promise<File | null> {
  const es = opciones.language === 'es';
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) throw new Error(es ? 'Google Drive no está configurado.' : 'Google Drive is not configured.');

  try {
    await loadPicker();
  } catch {
    throw new Error(es ? 'No se pudo abrir Google Drive. Revisa tu conexión o algún bloqueador de anuncios.' : 'Could not open Google Drive. Check your connection or ad blocker.');
  }

  let token: string;
  try {
    token = await getAccessToken(clientId);
  } catch (err) {
    if (err instanceof Error && err.message === 'cancelado') return null;
    throw new Error(es ? 'Google no dio permiso para abrir tu Drive.' : 'Google did not grant access to your Drive.');
  }

  const g = (window as Any).google;
  const elegido = await new Promise<{ id: string; name: string; mimeType: string } | null>((resolve) => {
    const vista = new g.picker.DocsView(g.picker.ViewId.DOCS)
      .setMimeTypes(opciones.mimeTypes.join(','))
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);
    const builder = new g.picker.PickerBuilder()
      .addView(vista)
      .setOAuthToken(token)
      // El número del proyecto (inicio del Client ID): con drive.file es lo
      // que le da a la app acceso al archivo que la persona elige.
      .setAppId(clientId.split('-')[0])
      .setLocale(opciones.language)
      .setTitle(es ? 'Elige el documento' : 'Choose the document')
      .setCallback((data: Any) => {
        const accion = data[g.picker.Response.ACTION];
        if (accion === g.picker.Action.PICKED) {
          const d = data[g.picker.Response.DOCUMENTS][0];
          resolve({ id: d[g.picker.Document.ID], name: d[g.picker.Document.NAME], mimeType: d[g.picker.Document.MIME_TYPE] });
        } else if (accion === g.picker.Action.CANCEL) {
          resolve(null);
        }
      });
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
    if (apiKey) builder.setDeveloperKey(apiKey);
    builder.build().setVisible(true);
  });
  if (!elegido) return null;

  try {
    return await descargar(token, elegido);
  } catch {
    throw new Error(es ? `No se pudo descargar «${elegido.name}» de Google Drive.` : `Could not download "${elegido.name}" from Google Drive.`);
  }
}
