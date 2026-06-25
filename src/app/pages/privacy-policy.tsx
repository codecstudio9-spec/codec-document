import { Link } from 'react-router';
import { Shield, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';
import { LanguageToggle } from '../components/language-toggle';

export function PrivacyPolicyPage() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Shield className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Codec Document
                </h1>
              </div>
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
            <ArrowLeft className="size-4" />
            {language === 'en' ? 'Back to Home' : 'Volver al Inicio'}
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h1 className="text-4xl font-bold mb-4">
              {language === 'en' ? 'Privacy Policy' : 'Política de Privacidad'}
            </h1>
            <p className="text-slate-600 mb-8">
              {language === 'en' 
                ? 'Last Updated: March 12, 2026'
                : 'Última Actualización: 12 de Marzo, 2026'}
            </p>

            <div className="prose prose-slate max-w-none">
              {language === 'en' ? (
                <>
                  <h2>1. Introduction</h2>
                  <p>
                    Codec Document ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
                  </p>
                  <p>
                    Please read this Privacy Policy carefully. By using Codec Document, you agree to the collection and use of information in accordance with this policy.
                  </p>

                  <h2>2. Information We Collect</h2>
                  
                  <h3>2.1 Information You Provide</h3>
                  <p>When you use our service, we may collect:</p>
                  <ul>
                    <li><strong>Document Form Data:</strong> Information you enter into our document forms (names, addresses, dates, etc.)</li>
                    <li><strong>Payment Information:</strong> Payment details are processed by PayPal. We do NOT store your credit card information</li>
                    <li><strong>Email Address:</strong> If you choose to provide it for document delivery</li>
                  </ul>

                  <h3>2.2 Automatically Collected Information</h3>
                  <p>When you visit our website, we automatically collect:</p>
                  <ul>
                    <li><strong>Usage Data:</strong> Pages visited, time spent, links clicked</li>
                    <li><strong>Device Information:</strong> Browser type, device type, IP address</li>
                    <li><strong>Cookies:</strong> Small files stored on your device (see Cookie Policy below)</li>
                  </ul>

                  <h2>3. How We Use Your Information</h2>
                  <p>We use the collected information for:</p>
                  <ul>
                    <li><strong>Document Generation:</strong> To create your customized legal documents</li>
                    <li><strong>Transaction Processing:</strong> To complete your purchase via PayPal</li>
                    <li><strong>Service Improvement:</strong> To analyze usage and improve our templates</li>
                    <li><strong>Communication:</strong> To send transaction confirmations (if email provided)</li>
                    <li><strong>Legal Compliance:</strong> To comply with legal obligations</li>
                  </ul>

                  <h2>4. Data Storage and Retention</h2>
                  <p>
                    <strong>Important:</strong> Codec Document does NOT permanently store your document data on our servers.
                  </p>
                  <ul>
                    <li><strong>Form Data:</strong> Stored temporarily in your browser's sessionStorage during your session only</li>
                    <li><strong>Transaction Records:</strong> We keep transaction IDs and amounts for accounting purposes (30 days)</li>
                    <li><strong>Analytics Data:</strong> Anonymized usage data retained for service improvement</li>
                  </ul>
                  <p>
                    Once you close your browser or clear your cache, all form data is deleted. We do not have access to or store the personal information you enter into document forms.
                  </p>

                  <h2>5. Third-Party Services</h2>
                  
                  <h3>5.1 PayPal</h3>
                  <p>
                    All payments are processed through PayPal. When you make a purchase, PayPal will collect and process your payment information according to their own Privacy Policy. We recommend reviewing PayPal's Privacy Policy at: <a href="https://www.paypal.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.paypal.com/privacy</a>
                  </p>

                  <h3>5.2 Analytics (If Applicable)</h3>
                  <p>
                    We may use Google Analytics or similar services to understand how users interact with our website. These services use cookies to collect anonymous usage data.
                  </p>

                  <h2>6. Cookies and Tracking Technologies</h2>
                  <p>We use cookies and similar technologies for:</p>
                  <ul>
                    <li><strong>Essential Cookies:</strong> Required for the website to function (e.g., sessionStorage for form data)</li>
                    <li><strong>Analytics Cookies:</strong> To understand how visitors use our site</li>
                    <li><strong>Preference Cookies:</strong> To remember your language selection</li>
                  </ul>
                  <p>
                    You can disable cookies in your browser settings, but this may affect the functionality of the website.
                  </p>

                  <h2>7. Data Security</h2>
                  <p>
                    We implement appropriate technical and organizational security measures to protect your information:
                  </p>
                  <ul>
                    <li>HTTPS encryption for all data transmission</li>
                    <li>Secure payment processing through PayPal</li>
                    <li>No permanent storage of sensitive personal information</li>
                    <li>Regular security audits and updates</li>
                  </ul>
                  <p>
                    However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                  </p>

                  <h2>8. Your Privacy Rights</h2>
                  <p>Depending on your location, you may have the following rights:</p>
                  <ul>
                    <li><strong>Access:</strong> Request a copy of the data we have about you</li>
                    <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                    <li><strong>Deletion:</strong> Request deletion of your data</li>
                    <li><strong>Opt-Out:</strong> Opt-out of marketing communications (if applicable)</li>
                    <li><strong>Data Portability:</strong> Request your data in a portable format</li>
                  </ul>
                  <p>
                    To exercise these rights, please contact us through our website.
                  </p>

                  <h2>9. California Privacy Rights (CCPA)</h2>
                  <p>
                    If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
                  </p>
                  <ul>
                    <li>Right to know what personal information is collected</li>
                    <li>Right to know if personal information is sold or disclosed</li>
                    <li>Right to opt-out of the sale of personal information</li>
                    <li>Right to deletion of personal information</li>
                    <li>Right to non-discrimination for exercising CCPA rights</li>
                  </ul>
                  <p>
                    <strong>Note:</strong> Codec Document does NOT sell your personal information to third parties.
                  </p>

                  <h2>10. Children's Privacy</h2>
                  <p>
                    Our service is not intended for users under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
                  </p>

                  <h2>11. International Users</h2>
                  <p>
                    Codec Document is based in the United States and our services are primarily intended for users in the United States. If you are accessing our service from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States.
                  </p>

                  <h2>12. Changes to This Privacy Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                  </p>
                  <p>
                    Your continued use of the service after any changes constitutes your acceptance of the new Privacy Policy.
                  </p>

                  <h2>13. Contact Us</h2>
                  <p>
                    If you have any questions about this Privacy Policy or our data practices, please contact us through our website.
                  </p>

                  <div className="bg-green-50 border-l-4 border-green-600 p-6 mt-8">
                    <p className="font-bold mb-2">Your Privacy Matters</p>
                    <p>
                      At Codec Document, we are committed to protecting your privacy. We do not permanently store your personal information, and we do not sell your data to third parties. Your document data stays in your browser during your session and is deleted when you close the browser.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h2>1. Introducción</h2>
                  <p>
                    Codec Document ("nosotros", "nos" o "nuestro") está comprometido a proteger su privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos su información cuando usa nuestro sitio web y servicios.
                  </p>
                  <p>
                    Por favor lea esta Política de Privacidad cuidadosamente. Al usar Codec Document, usted acepta la recopilación y uso de información de acuerdo con esta política.
                  </p>

                  <h2>2. Información que Recopilamos</h2>
                  
                  <h3>2.1 Información que Usted Proporciona</h3>
                  <p>Cuando usa nuestro servicio, podemos recopilar:</p>
                  <ul>
                    <li><strong>Datos del Formulario:</strong> Información que ingresa en nuestros formularios (nombres, direcciones, fechas, etc.)</li>
                    <li><strong>Información de Pago:</strong> Los detalles de pago son procesados por PayPal. NO almacenamos información de tarjetas de crédito</li>
                    <li><strong>Correo Electrónico:</strong> Si elige proporcionarlo para la entrega de documentos</li>
                  </ul>

                  <h3>2.2 Información Recopilada Automáticamente</h3>
                  <p>Cuando visita nuestro sitio web, recopilamos automáticamente:</p>
                  <ul>
                    <li><strong>Datos de Uso:</strong> Páginas visitadas, tiempo dedicado, enlaces clickeados</li>
                    <li><strong>Información del Dispositivo:</strong> Tipo de navegador, tipo de dispositivo, dirección IP</li>
                    <li><strong>Cookies:</strong> Pequeños archivos almacenados en su dispositivo (ver Política de Cookies abajo)</li>
                  </ul>

                  <h2>3. Cómo Usamos Su Información</h2>
                  <p>Usamos la información recopilada para:</p>
                  <ul>
                    <li><strong>Generación de Documentos:</strong> Para crear sus documentos legales personalizados</li>
                    <li><strong>Procesamiento de Transacciones:</strong> Para completar su compra vía PayPal</li>
                    <li><strong>Mejora del Servicio:</strong> Para analizar el uso y mejorar nuestras plantillas</li>
                    <li><strong>Comunicación:</strong> Para enviar confirmaciones de transacciones (si proporciona email)</li>
                    <li><strong>Cumplimiento Legal:</strong> Para cumplir con obligaciones legales</li>
                  </ul>

                  <h2>4. Almacenamiento y Retención de Datos</h2>
                  <p>
                    <strong>Importante:</strong> Codec Document NO almacena permanentemente los datos de sus documentos en nuestros servidores.
                  </p>
                  <ul>
                    <li><strong>Datos del Formulario:</strong> Almacenados temporalmente en el sessionStorage de su navegador solo durante su sesión</li>
                    <li><strong>Registros de Transacciones:</strong> Mantenemos IDs de transacciones y montos para propósitos contables (30 días)</li>
                    <li><strong>Datos de Analytics:</strong> Datos de uso anonimizados retenidos para mejorar el servicio</li>
                  </ul>
                  <p>
                    Una vez que cierra su navegador o limpia su caché, todos los datos del formulario se eliminan. No tenemos acceso ni almacenamos la información personal que ingresa en los formularios de documentos.
                  </p>

                  <h2>5. Servicios de Terceros</h2>
                  
                  <h3>5.1 PayPal</h3>
                  <p>
                    Todos los pagos se procesan a través de PayPal. Cuando realiza una compra, PayPal recopilará y procesará su información de pago de acuerdo con su propia Política de Privacidad. Recomendamos revisar la Política de Privacidad de PayPal en: <a href="https://www.paypal.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.paypal.com/privacy</a>
                  </p>

                  <h3>5.2 Analytics (Si Aplica)</h3>
                  <p>
                    Podemos usar Google Analytics o servicios similares para entender cómo los usuarios interactúan con nuestro sitio web. Estos servicios usan cookies para recopilar datos de uso anónimos.
                  </p>

                  <h2>6. Cookies y Tecnologías de Seguimiento</h2>
                  <p>Usamos cookies y tecnologías similares para:</p>
                  <ul>
                    <li><strong>Cookies Esenciales:</strong> Requeridas para que el sitio web funcione (ej. sessionStorage para datos del formulario)</li>
                    <li><strong>Cookies de Analytics:</strong> Para entender cómo los visitantes usan nuestro sitio</li>
                    <li><strong>Cookies de Preferencia:</strong> Para recordar su selección de idioma</li>
                  </ul>
                  <p>
                    Puede deshabilitar las cookies en la configuración de su navegador, pero esto puede afectar la funcionalidad del sitio web.
                  </p>

                  <h2>7. Seguridad de Datos</h2>
                  <p>
                    Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger su información:
                  </p>
                  <ul>
                    <li>Encriptación HTTPS para toda la transmisión de datos</li>
                    <li>Procesamiento de pagos seguro a través de PayPal</li>
                    <li>Sin almacenamiento permanente de información personal sensible</li>
                    <li>Auditorías de seguridad y actualizaciones regulares</li>
                  </ul>
                  <p>
                    Sin embargo, ningún método de transmisión por Internet es 100% seguro. Aunque nos esforzamos por proteger su información, no podemos garantizar seguridad absoluta.
                  </p>

                  <h2>8. Sus Derechos de Privacidad</h2>
                  <p>Dependiendo de su ubicación, puede tener los siguientes derechos:</p>
                  <ul>
                    <li><strong>Acceso:</strong> Solicitar una copia de los datos que tenemos sobre usted</li>
                    <li><strong>Corrección:</strong> Solicitar corrección de datos inexactos</li>
                    <li><strong>Eliminación:</strong> Solicitar eliminación de sus datos</li>
                    <li><strong>Opt-Out:</strong> Optar por no recibir comunicaciones de marketing (si aplica)</li>
                    <li><strong>Portabilidad de Datos:</strong> Solicitar sus datos en formato portable</li>
                  </ul>
                  <p>
                    Para ejercer estos derechos, por favor contáctenos a través de nuestro sitio web.
                  </p>

                  <h2>9. Derechos de Privacidad de California (CCPA)</h2>
                  <p>
                    Si es residente de California, tiene derechos adicionales bajo la Ley de Privacidad del Consumidor de California (CCPA):
                  </p>
                  <ul>
                    <li>Derecho a saber qué información personal se recopila</li>
                    <li>Derecho a saber si la información personal se vende o divulga</li>
                    <li>Derecho a optar por no vender información personal</li>
                    <li>Derecho a eliminación de información personal</li>
                    <li>Derecho a no discriminación por ejercer derechos CCPA</li>
                  </ul>
                  <p>
                    <strong>Nota:</strong> Codec Document NO vende su información personal a terceros.
                  </p>

                  <h2>10. Privacidad de Menores</h2>
                  <p>
                    Nuestro servicio no está destinado a usuarios menores de 18 años. No recopilamos intencionalmente información personal de menores de 18 años. Si es padre o tutor y cree que su hijo nos ha proporcionado información personal, por favor contáctenos.
                  </p>

                  <h2>11. Usuarios Internacionales</h2>
                  <p>
                    Codec Document tiene su sede en los Estados Unidos y nuestros servicios están destinados principalmente a usuarios en los Estados Unidos. Si accede a nuestro servicio desde fuera de los Estados Unidos, tenga en cuenta que su información puede ser transferida, almacenada y procesada en los Estados Unidos.
                  </p>

                  <h2>12. Cambios a Esta Política de Privacidad</h2>
                  <p>
                    Podemos actualizar esta Política de Privacidad de vez en cuando. Le notificaremos de cualquier cambio publicando la nueva Política de Privacidad en esta página y actualizando la fecha de "Última Actualización".
                  </p>
                  <p>
                    Su uso continuado del servicio después de cualquier cambio constituye su aceptación de la nueva Política de Privacidad.
                  </p>

                  <h2>13. Contáctenos</h2>
                  <p>
                    Si tiene alguna pregunta sobre esta Política de Privacidad o nuestras prácticas de datos, por favor contáctenos a través de nuestro sitio web.
                  </p>

                  <div className="bg-green-50 border-l-4 border-green-600 p-6 mt-8">
                    <p className="font-bold mb-2">Su Privacidad Importa</p>
                    <p>
                      En Codec Document, estamos comprometidos a proteger su privacidad. No almacenamos permanentemente su información personal y no vendemos sus datos a terceros. Los datos de sus documentos permanecen en su navegador durante su sesión y se eliminan cuando cierra el navegador.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} Codec Document</p>
            <p className="mt-2">
              {language === 'en' ? 'Made with' : 'Hecho con'} ❤️ {language === 'en' ? 'by' : 'por'}{' '}
              <a 
                href="https://codecstudio.online/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Codec Studio
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
