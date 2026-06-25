import { Link } from 'react-router';
import { Shield, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';
import { LanguageToggle } from '../components/language-toggle';

export function TermsOfServicePage() {
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
              {language === 'en' ? 'Terms of Service' : 'Términos de Servicio'}
            </h1>
            <p className="text-slate-600 mb-8">
              {language === 'en' 
                ? 'Last Updated: March 12, 2026'
                : 'Última Actualización: 12 de Marzo, 2026'}
            </p>

            <div className="prose prose-slate max-w-none">
              {language === 'en' ? (
                <>
                  <h2>1. Acceptance of Terms</h2>
                  <p>
                    By accessing and using Codec Document ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
                  </p>

                  <h2>2. Description of Service</h2>
                  <p>
                    Codec Document provides customizable legal document templates for users in the United States. Our service allows you to:
                  </p>
                  <ul>
                    <li>Browse state-specific legal document templates</li>
                    <li>Fill out customizable forms with your information</li>
                    <li>Preview documents for free with watermark</li>
                    <li>Purchase and download professional PDF documents without watermark</li>
                  </ul>

                  <h2>3. User Responsibilities</h2>
                  <p>You agree to:</p>
                  <ul>
                    <li>Provide accurate and complete information when filling out forms</li>
                    <li>Use the documents for lawful purposes only</li>
                    <li>Not reproduce, duplicate, copy, or resell any portion of the Service without written permission</li>
                    <li>Not use the documents to engage in any illegal activity</li>
                    <li>Seek professional legal advice when necessary</li>
                  </ul>

                  <h2>4. Legal Disclaimer - Not Legal Advice</h2>
                  <p className="font-bold text-red-600">
                    IMPORTANT: Codec Document is NOT a law firm and does NOT provide legal advice.
                  </p>
                  <p>
                    The document templates provided are for informational purposes only and are not a substitute for legal advice from a licensed attorney. We strongly recommend that you consult with a qualified attorney to review any legal document before signing or relying on it.
                  </p>
                  <p>
                    Codec Document does not guarantee that the documents will meet your specific needs or be legally enforceable in your jurisdiction. Laws vary by state and change over time.
                  </p>

                  <h2>5. No Attorney-Client Relationship</h2>
                  <p>
                    Use of Codec Document does NOT create an attorney-client relationship between you and Codec Document, Codec Studio, or any affiliated parties. You are solely responsible for the legal consequences of using our documents.
                  </p>

                  <h2>6. Payment and Pricing</h2>
                  <ul>
                    <li>All prices are listed in USD ($)</li>
                    <li>Payment is processed securely through PayPal</li>
                    <li>Prices are subject to change without notice</li>
                    <li>One-time payment per document (no subscriptions)</li>
                    <li>You will receive immediate access to download your document after successful payment</li>
                  </ul>

                  <h2>7. No Refund Policy</h2>
                  <p className="font-bold text-red-600">
                    ALL SALES ARE FINAL. WE DO NOT OFFER REFUNDS.
                  </p>
                  <p>
                    Because you have the ability to preview the complete document with a watermark before purchasing, we do not offer refunds once payment has been completed. By making a purchase, you acknowledge that you have reviewed the preview and are satisfied with the document.
                  </p>
                  <p>
                    Please review the preview carefully before purchasing to ensure the document meets your needs.
                  </p>

                  <h2>8. Intellectual Property</h2>
                  <p>
                    All content on Codec Document, including templates, text, graphics, logos, and software, is the property of Codec Studio and is protected by copyright and intellectual property laws.
                  </p>
                  <p>
                    When you purchase a document, you receive a limited license to use that specific document for your personal or business use. You may NOT:
                  </p>
                  <ul>
                    <li>Resell or redistribute the templates</li>
                    <li>Claim the templates as your own work</li>
                    <li>Use the templates to create competing services</li>
                  </ul>

                  <h2>9. Limitation of Liability</h2>
                  <p>
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, CODEC DOCUMENT AND CODEC STUDIO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                  </p>
                  <p>
                    We are not responsible for any legal consequences arising from the use or misuse of our document templates.
                  </p>

                  <h2>10. Disclaimer of Warranties</h2>
                  <p>
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                  </p>
                  <p>
                    We do not warrant that:
                  </p>
                  <ul>
                    <li>The Service will be uninterrupted or error-free</li>
                    <li>The documents will be legally sufficient for your needs</li>
                    <li>The information provided is complete or up-to-date</li>
                  </ul>

                  <h2>11. User Account and Security</h2>
                  <p>
                    Currently, Codec Document does not require user accounts. All transactions are processed through PayPal. You are responsible for maintaining the confidentiality of your PayPal account credentials.
                  </p>

                  <h2>12. Privacy</h2>
                  <p>
                    Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
                  </p>

                  <h2>13. Modifications to Service</h2>
                  <p>
                    We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice at any time.
                  </p>

                  <h2>14. Governing Law</h2>
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
                  </p>

                  <h2>15. Changes to Terms</h2>
                  <p>
                    We reserve the right to update or modify these Terms of Service at any time without prior notice. Your continued use of the Service after any changes constitutes acceptance of the new Terms.
                  </p>

                  <h2>16. Contact Information</h2>
                  <p>
                    If you have any questions about these Terms of Service, please contact us through our website.
                  </p>

                  <h2>17. Severability</h2>
                  <p>
                    If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
                  </p>

                  <h2>18. Entire Agreement</h2>
                  <p>
                    These Terms of Service constitute the entire agreement between you and Codec Document regarding the use of the Service.
                  </p>

                  <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mt-8">
                    <p className="font-bold mb-2">By using Codec Document, you acknowledge that:</p>
                    <ul className="space-y-2">
                      <li>✓ You have read and understood these Terms of Service</li>
                      <li>✓ You agree to be bound by these terms</li>
                      <li>✓ You understand this is not legal advice</li>
                      <li>✓ All sales are final (no refunds)</li>
                      <li>✓ You should consult an attorney for legal matters</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <h2>1. Aceptación de los Términos</h2>
                  <p>
                    Al acceder y usar Codec Document ("el Servicio"), usted acepta y está de acuerdo en cumplir con los términos y disposiciones de este acuerdo. Si no está de acuerdo con estos Términos de Servicio, por favor no use el Servicio.
                  </p>

                  <h2>2. Descripción del Servicio</h2>
                  <p>
                    Codec Document proporciona plantillas de documentos legales personalizables para usuarios en los Estados Unidos. Nuestro servicio le permite:
                  </p>
                  <ul>
                    <li>Navegar plantillas de documentos legales específicas por estado</li>
                    <li>Completar formularios personalizables con su información</li>
                    <li>Previsualizar documentos gratis con marca de agua</li>
                    <li>Comprar y descargar documentos PDF profesionales sin marca de agua</li>
                  </ul>

                  <h2>3. Responsabilidades del Usuario</h2>
                  <p>Usted acepta:</p>
                  <ul>
                    <li>Proporcionar información precisa y completa al completar formularios</li>
                    <li>Usar los documentos solo para propósitos legales</li>
                    <li>No reproducir, duplicar, copiar o revender ninguna parte del Servicio sin permiso escrito</li>
                    <li>No usar los documentos para participar en ninguna actividad ilegal</li>
                    <li>Buscar asesoramiento legal profesional cuando sea necesario</li>
                  </ul>

                  <h2>4. Descargo Legal - No Es Asesoramiento Legal</h2>
                  <p className="font-bold text-red-600">
                    IMPORTANTE: Codec Document NO es un bufete de abogados y NO proporciona asesoramiento legal.
                  </p>
                  <p>
                    Las plantillas de documentos proporcionadas son solo para fines informativos y no son un sustituto del asesoramiento legal de un abogado licenciado. Recomendamos encarecidamente que consulte con un abogado calificado para revisar cualquier documento legal antes de firmarlo o confiar en él.
                  </p>
                  <p>
                    Codec Document no garantiza que los documentos cumplan con sus necesidades específicas o sean legalmente ejecutables en su jurisdicción. Las leyes varían por estado y cambian con el tiempo.
                  </p>

                  <h2>5. Sin Relación Abogado-Cliente</h2>
                  <p>
                    El uso de Codec Document NO crea una relación abogado-cliente entre usted y Codec Document, Codec Studio o cualquier parte afiliada. Usted es el único responsable de las consecuencias legales del uso de nuestros documentos.
                  </p>

                  <h2>6. Pago y Precios</h2>
                  <ul>
                    <li>Todos los precios están listados en USD ($)</li>
                    <li>El pago se procesa de forma segura a través de PayPal</li>
                    <li>Los precios están sujetos a cambios sin previo aviso</li>
                    <li>Pago único por documento (sin suscripciones)</li>
                    <li>Recibirá acceso inmediato para descargar su documento después del pago exitoso</li>
                  </ul>

                  <h2>7. Política de No Reembolsos</h2>
                  <p className="font-bold text-red-600">
                    TODAS LAS VENTAS SON FINALES. NO OFRECEMOS REEMBOLSOS.
                  </p>
                  <p>
                    Debido a que tiene la capacidad de previsualizar el documento completo con marca de agua antes de comprar, no ofrecemos reembolsos una vez que el pago se ha completado. Al realizar una compra, usted reconoce que ha revisado la vista previa y está satisfecho con el documento.
                  </p>
                  <p>
                    Por favor revise la vista previa cuidadosamente antes de comprar para asegurarse de que el documento cumpla con sus necesidades.
                  </p>

                  <h2>8. Propiedad Intelectual</h2>
                  <p>
                    Todo el contenido en Codec Document, incluyendo plantillas, texto, gráficos, logos y software, es propiedad de Codec Studio y está protegido por leyes de derechos de autor y propiedad intelectual.
                  </p>
                  <p>
                    Cuando compra un documento, recibe una licencia limitada para usar ese documento específico para su uso personal o comercial. Usted NO puede:
                  </p>
                  <ul>
                    <li>Revender o redistribuir las plantillas</li>
                    <li>Reclamar las plantillas como su propio trabajo</li>
                    <li>Usar las plantillas para crear servicios competidores</li>
                  </ul>

                  <h2>9. Limitación de Responsabilidad</h2>
                  <p>
                    EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, CODEC DOCUMENT Y CODEC STUDIO NO SERÁN RESPONSABLES DE NINGÚN DAÑO INDIRECTO, INCIDENTAL, ESPECIAL, CONSECUENTE O PUNITIVO, O CUALQUIER PÉRDIDA DE GANANCIAS O INGRESOS, YA SEA INCURRIDA DIRECTA O INDIRECTAMENTE, O CUALQUIER PÉRDIDA DE DATOS, USO, BUENA VOLUNTAD U OTRAS PÉRDIDAS INTANGIBLES.
                  </p>
                  <p>
                    No somos responsables de ninguna consecuencia legal que surja del uso o mal uso de nuestras plantillas de documentos.
                  </p>

                  <h2>10. Descargo de Garantías</h2>
                  <p>
                    EL SERVICIO SE PROPORCIONA "TAL CUAL" Y "SEGÚN DISPONIBILIDAD" SIN GARANTÍAS DE NINGÚN TIPO, YA SEA EXPRESA O IMPLÍCITA, INCLUYENDO PERO NO LIMITADO A GARANTÍAS IMPLÍCITAS DE COMERCIABILIDAD, IDONEIDAD PARA UN PROPÓSITO PARTICULAR Y NO INFRACCIÓN.
                  </p>
                  <p>
                    No garantizamos que:
                  </p>
                  <ul>
                    <li>El Servicio será ininterrumpido o libre de errores</li>
                    <li>Los documentos serán legalmente suficientes para sus necesidades</li>
                    <li>La información proporcionada es completa o actualizada</li>
                  </ul>

                  <h2>11. Cuenta de Usuario y Seguridad</h2>
                  <p>
                    Actualmente, Codec Document no requiere cuentas de usuario. Todas las transacciones se procesan a través de PayPal. Usted es responsable de mantener la confidencialidad de las credenciales de su cuenta de PayPal.
                  </p>

                  <h2>12. Privacidad</h2>
                  <p>
                    Su uso del Servicio también se rige por nuestra Política de Privacidad. Por favor revise nuestra Política de Privacidad para entender nuestras prácticas.
                  </p>

                  <h2>13. Modificaciones al Servicio</h2>
                  <p>
                    Nos reservamos el derecho de modificar o discontinuar, temporal o permanentemente, el Servicio (o cualquier parte del mismo) con o sin aviso en cualquier momento.
                  </p>

                  <h2>14. Ley Aplicable</h2>
                  <p>
                    Estos Términos se regirán e interpretarán de acuerdo con las leyes de los Estados Unidos, sin tener en cuenta sus disposiciones sobre conflictos de leyes.
                  </p>

                  <h2>15. Cambios a los Términos</h2>
                  <p>
                    Nos reservamos el derecho de actualizar o modificar estos Términos de Servicio en cualquier momento sin previo aviso. Su uso continuado del Servicio después de cualquier cambio constituye la aceptación de los nuevos Términos.
                  </p>

                  <h2>16. Información de Contacto</h2>
                  <p>
                    Si tiene alguna pregunta sobre estos Términos de Servicio, por favor contáctenos a través de nuestro sitio web.
                  </p>

                  <h2>17. Divisibilidad</h2>
                  <p>
                    Si alguna disposición de estos Términos se considera inaplicable o inválida, esa disposición se limitará o eliminará en la medida mínima necesaria para que estos Términos permanezcan en pleno vigor y efecto.
                  </p>

                  <h2>18. Acuerdo Completo</h2>
                  <p>
                    Estos Términos de Servicio constituyen el acuerdo completo entre usted y Codec Document con respecto al uso del Servicio.
                  </p>

                  <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mt-8">
                    <p className="font-bold mb-2">Al usar Codec Document, usted reconoce que:</p>
                    <ul className="space-y-2">
                      <li>✓ Ha leído y entendido estos Términos de Servicio</li>
                      <li>✓ Acepta estar obligado por estos términos</li>
                      <li>✓ Entiende que esto no es asesoramiento legal</li>
                      <li>✓ Todas las ventas son finales (sin reembolsos)</li>
                      <li>✓ Debe consultar a un abogado para asuntos legales</li>
                    </ul>
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
