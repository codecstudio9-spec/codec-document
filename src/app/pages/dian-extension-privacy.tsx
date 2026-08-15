import { Link } from 'react-router';
import { Shield, ArrowLeft } from 'lucide-react';
import { INFO_EMAIL } from '../config/site';

/**
 * Política de privacidad de la extensión "Codec Document — Descargador
 * DIAN" (extension-dian/), exigida por la Chrome Web Store para publicar
 * una extensión que pide permisos de "cookies" y acceso a un dominio
 * externo (la DIAN). Página aparte de la política general del sitio a
 * propósito: un revisor de Google necesita encontrar rápido qué hace ESTA
 * pieza de software con los datos, no leer la política entera de la app.
 *
 * Español solamente: el público de esta extensión son contadores
 * colombianos, no hace falta el selector de idioma que sí tiene el resto
 * del sitio.
 */
export function DianExtensionPrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/80 shadow-sm backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-2 shadow-lg">
              <Shield className="size-6 text-white" />
            </div>
            <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-xl font-bold text-transparent">
              Codec Document
            </h1>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <Link to="/documentos-electronicos" className="mb-8 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
            <ArrowLeft className="size-4" />
            Volver
          </Link>

          <div className="rounded-2xl bg-white p-8 shadow-lg md:p-12">
            <h1 className="mb-2 text-3xl font-bold text-slate-900">
              Privacidad — Codec Document, Descargador DIAN
            </h1>
            <p className="mb-8 text-sm text-slate-500">
              Extensión de Chrome · Última actualización: 14 de agosto de 2026
            </p>

            <div className="prose prose-slate max-w-none">
              <h2>Qué hace esta extensión</h2>
              <p>
                Descarga tus documentos electrónicos (facturas, notas crédito/débito, nómina)
                desde el portal de la DIAN (<code>catalogo-vpfe.dian.gov.co</code> y dominios
                equivalentes) usando el enlace de token que la DIAN te envía por correo. Los
                archivos quedan en tu carpeta de Descargas, dentro de <code>DIAN/</code>.
              </p>
              <p>
                Existe porque la DIAN ata ese token a la computadora que lo solicitó: un
                servidor compartido no puede autenticarlo, así que la descarga tiene que
                correr dentro de tu propio navegador, con tu propia sesión.
              </p>

              <h2>Qué datos toca, y qué NO hace con ellos</h2>
              <ul>
                <li>
                  <strong>El enlace del token y la lista de CUFEs que pegas:</strong> se usan
                  únicamente para pedirle los documentos a la DIAN. No se guardan en ningún
                  servidor nuestro ni de terceros — quedan sólo en tu computador
                  (<code>chrome.storage.local</code>, para poder reanudar una descarga larga
                  si el token vence a mitad).
                </li>
                <li>
                  <strong>Las cookies de sesión de la DIAN:</strong> las maneja el propio
                  Chrome, como con cualquier sitio que visitas. La extensión no las lee ni las
                  extrae — sólo consulta si existe una cookie de sesión activa para mostrarte
                  si el enlace funcionó.
                </li>
                <li>
                  <strong>Los documentos descargados:</strong> van directo a tu disco. La
                  extensión no los sube a ningún servidor por su cuenta — eso lo decides tú,
                  después, arrastrándolos a Codec Document.
                </li>
              </ul>
              <p>
                No hay analítica, no hay rastreo, no se manda nada a nuestros servidores ni a
                terceros. El único tráfico que genera esta extensión es entre tu navegador y
                los dominios oficiales de la DIAN.
              </p>

              <h2>Por qué pide cada permiso</h2>
              <ul>
                <li><strong>Acceso a los dominios de la DIAN</strong> (<code>catalogo-vpfe.dian.gov.co</code> y equivalentes): para poder pedirle los documentos.</li>
                <li><strong>downloads:</strong> para guardar los archivos en tu carpeta de Descargas.</li>
                <li><strong>storage:</strong> para recordar el progreso de una descarga larga en tu propio computador.</li>
                <li><strong>cookies:</strong> sólo para comprobar si la sesión con la DIAN sigue activa; no se leen sus valores fuera de esa comprobación.</li>
                <li>
                  <strong>Comunicación con codecdocument.com</strong> (<code>externally_connectable</code>):
                  le permite a la app web preguntarle a la extensión "¿estás instalada?", nada
                  más — no le da a la web acceso a tu sesión de la DIAN ni a lo descargado.
                </li>
              </ul>

              <h2>Contacto</h2>
              <p>
                Preguntas sobre esta extensión: <a href={`mailto:${INFO_EMAIL}`}>{INFO_EMAIL}</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
