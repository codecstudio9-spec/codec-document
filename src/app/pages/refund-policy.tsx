import { Link } from 'react-router';
import { Shield, ArrowLeft, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';
import { LanguageToggle } from '../components/language-toggle';

export function RefundPolicyPage() {
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
              {language === 'en' ? 'No Refund Policy' : 'Política de No Reembolsos'}
            </h1>
            <p className="text-slate-600 mb-8">
              {language === 'en' 
                ? 'Last Updated: March 12, 2026'
                : 'Última Actualización: 12 de Marzo, 2026'}
            </p>

            <div className="bg-red-50 border-l-4 border-red-600 p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-red-900 text-lg mb-2">
                    {language === 'en' ? 'IMPORTANT: ALL SALES ARE FINAL' : 'IMPORTANTE: TODAS LAS VENTAS SON FINALES'}
                  </p>
                  <p className="text-red-800">
                    {language === 'en'
                      ? 'Codec Document does NOT offer refunds, returns, or exchanges for any purchased documents. Please read this policy carefully before making a purchase.'
                      : 'Codec Document NO ofrece reembolsos, devoluciones o cambios para ningún documento comprado. Por favor lea esta política cuidadosamente antes de realizar una compra.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="prose prose-slate max-w-none">
              {language === 'en' ? (
                <>
                  <h2>1. No Refund Policy</h2>
                  <p>
                    <strong>All sales are final.</strong> Once you complete a purchase and download your document, we do NOT offer refunds, returns, exchanges, or cancellations for any reason.
                  </p>
                  <p>
                    This policy applies to all document purchases, regardless of:
                  </p>
                  <ul>
                    <li>Whether you have downloaded the document</li>
                    <li>Whether you have used the document</li>
                    <li>Whether the document meets your expectations</li>
                    <li>Any mistakes made during the purchase process</li>
                    <li>Changes in your circumstances or needs</li>
                  </ul>

                  <h2>2. Why We Have a No Refund Policy</h2>
                  <p>
                    Our no refund policy exists because:
                  </p>
                  <ol>
                    <li>
                      <strong>Digital Nature of Product:</strong> Our documents are digital products that are delivered instantly upon purchase. Once downloaded, the product cannot be "returned" as it has already been delivered to you in full.
                    </li>
                    <li>
                      <strong>Free Preview Available:</strong> You have complete access to preview the entire document with a watermark BEFORE purchasing. This allows you to review the full content, structure, and quality of the document to ensure it meets your needs.
                    </li>
                    <li>
                      <strong>Customization:</strong> Each document is customized with your specific information during the generation process, making it unique to your use case.
                    </li>
                    <li>
                      <strong>Intellectual Property:</strong> Our document templates contain proprietary content and legal formatting that has value upon delivery.
                    </li>
                  </ol>

                  <h2>3. Preview Before You Buy</h2>
                  <p>
                    <strong>IMPORTANT: Always review the preview before purchasing!</strong>
                  </p>
                  <p>
                    Codec Document provides a FREE preview feature that allows you to:
                  </p>
                  <ul>
                    <li>See the COMPLETE document with your information filled in</li>
                    <li>Review all sections, clauses, and legal language</li>
                    <li>Download a watermarked PDF version for your review</li>
                    <li>Verify that all fields are correctly filled</li>
                    <li>Ensure the document meets your specific needs</li>
                  </ul>
                  <p>
                    The preview shows you EXACTLY what you will receive, with the only difference being the removal of the watermark after purchase.
                  </p>
                  <p className="font-bold text-blue-900 bg-blue-50 p-4 rounded-lg">
                    By making a purchase, you acknowledge that you have reviewed the complete preview and are satisfied with the document's content and structure.
                  </p>

                  <h2>4. What to Check Before Purchasing</h2>
                  <p>
                    Before completing your purchase, please verify:
                  </p>
                  <ul>
                    <li>✓ All your information is entered correctly (names, addresses, dates, amounts, etc.)</li>
                    <li>✓ The document type is appropriate for your specific needs</li>
                    <li>✓ The document complies with your state's requirements (if applicable)</li>
                    <li>✓ All optional fields you wanted to include are filled in</li>
                    <li>✓ The language (English/Spanish) is correct</li>
                    <li>✓ The formatting and layout are acceptable</li>
                    <li>✓ You understand this is a template and may need attorney review</li>
                  </ul>

                  <h2>5. No Exceptions</h2>
                  <p>
                    We do NOT make exceptions to this policy for any reason, including but not limited to:
                  </p>
                  <ul>
                    <li>❌ "I didn't read the preview carefully"</li>
                    <li>❌ "I made a mistake entering my information"</li>
                    <li>❌ "I changed my mind"</li>
                    <li>❌ "I found a similar document cheaper elsewhere"</li>
                    <li>❌ "My attorney said it's not suitable"</li>
                    <li>❌ "I purchased the wrong document by mistake"</li>
                    <li>❌ "The document doesn't meet my specific legal situation"</li>
                    <li>❌ Technical issues on your end after purchase</li>
                  </ul>

                  <h2>6. Technical Issues During Purchase</h2>
                  <p>
                    If you experience technical issues DURING the purchase process (e.g., payment processed but document not delivered), please contact us immediately. We will:
                  </p>
                  <ul>
                    <li>Verify your purchase with PayPal</li>
                    <li>Provide you with the document you paid for</li>
                    <li>Assist with any technical delivery issues</li>
                  </ul>
                  <p>
                    However, this does NOT constitute a refund policy. We will ensure you receive the product you purchased, but we will not refund your payment.
                  </p>

                  <h2>7. PayPal Disputes and Chargebacks</h2>
                  <p>
                    <strong>Please do not file PayPal disputes or chargebacks.</strong>
                  </p>
                  <p>
                    If you file a dispute or chargeback:
                  </p>
                  <ul>
                    <li>We will provide PayPal with evidence that you previewed the document before purchase</li>
                    <li>We will provide proof of delivery (download confirmation)</li>
                    <li>We will reference our clearly stated No Refund Policy that you agreed to</li>
                    <li>Filing fraudulent chargebacks may result in legal action</li>
                  </ul>
                  <p>
                    If you have a legitimate technical issue, please contact us directly first so we can resolve it.
                  </p>

                  <h2>8. Document Quality Assurance</h2>
                  <p>
                    While we strive to provide high-quality, legally sound document templates:
                  </p>
                  <ul>
                    <li>Our documents are templates, not custom legal advice</li>
                    <li>Laws vary by state and change over time</li>
                    <li>We recommend having an attorney review any legal document before use</li>
                    <li>We are not responsible for the legal effectiveness of the documents</li>
                  </ul>
                  <p>
                    This is clearly stated in our Terms of Service and legal disclaimers, which you agree to before purchase.
                  </p>

                  <h2>9. Customer Support</h2>
                  <p>
                    While we do not offer refunds, we ARE committed to customer satisfaction:
                  </p>
                  <ul>
                    <li>We will answer questions about how to use our documents</li>
                    <li>We will help with technical issues accessing your purchased document</li>
                    <li>We will clarify any confusion about document features</li>
                    <li>We welcome feedback to improve our templates</li>
                  </ul>
                  <p>
                    Please contact us if you need assistance, but understand that we cannot offer refunds.
                  </p>

                  <h2>10. Acknowledgment</h2>
                  <p>
                    By completing a purchase on Codec Document, you acknowledge and agree that:
                  </p>
                  <ul>
                    <li>✓ You have read and understood this No Refund Policy</li>
                    <li>✓ You have reviewed the complete document preview before purchasing</li>
                    <li>✓ You understand that all sales are final with no refunds, returns, or exchanges</li>
                    <li>✓ You accept full responsibility for verifying the document meets your needs before purchase</li>
                    <li>✓ You will not file disputes or chargebacks for products that were delivered as described</li>
                  </ul>

                  <h2>11. Legal Disclaimer</h2>
                  <p>
                    This No Refund Policy is part of our Terms of Service. By using Codec Document, you agree to be bound by this policy. This policy may be updated at any time, and your continued use of the service constitutes acceptance of any changes.
                  </p>

                  <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6 mt-8">
                    <p className="font-bold text-yellow-900 mb-2">
                      ⚠️ Before You Purchase - Final Checklist
                    </p>
                    <ul className="space-y-2 text-yellow-900">
                      <li>□ I have previewed the COMPLETE document with my information</li>
                      <li>□ I have verified all my information is correct</li>
                      <li>□ I understand this is a template and may need attorney review</li>
                      <li>□ I understand there are NO REFUNDS for any reason</li>
                      <li>□ I am ready to make a final purchase</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mt-8">
                    <p className="font-bold text-blue-900 mb-2">
                      Questions? Contact Us BEFORE Purchasing
                    </p>
                    <p className="text-blue-800">
                      If you have any questions or concerns about a document, please contact us BEFORE making your purchase. We're happy to help you determine if a document is right for your needs - but we cannot offer refunds after purchase.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h2>1. Política de No Reembolsos</h2>
                  <p>
                    <strong>Todas las ventas son finales.</strong> Una vez que completa una compra y descarga su documento, NO ofrecemos reembolsos, devoluciones, cambios o cancelaciones por ninguna razón.
                  </p>
                  <p>
                    Esta política aplica a todas las compras de documentos, independientemente de:
                  </p>
                  <ul>
                    <li>Si ha descargado el documento</li>
                    <li>Si ha usado el documento</li>
                    <li>Si el documento cumple con sus expectativas</li>
                    <li>Cualquier error cometido durante el proceso de compra</li>
                    <li>Cambios en sus circunstancias o necesidades</li>
                  </ul>

                  <h2>2. Por Qué Tenemos una Política de No Reembolsos</h2>
                  <p>
                    Nuestra política de no reembolsos existe porque:
                  </p>
                  <ol>
                    <li>
                      <strong>Naturaleza Digital del Producto:</strong> Nuestros documentos son productos digitales que se entregan instantáneamente al comprar. Una vez descargado, el producto no puede ser "devuelto" ya que ha sido entregado a usted en su totalidad.
                    </li>
                    <li>
                      <strong>Vista Previa Gratis Disponible:</strong> Tiene acceso completo para previsualizar el documento entero con marca de agua ANTES de comprar. Esto le permite revisar el contenido completo, estructura y calidad del documento para asegurarse de que cumple con sus necesidades.
                    </li>
                    <li>
                      <strong>Personalización:</strong> Cada documento es personalizado con su información específica durante el proceso de generación, haciéndolo único para su caso de uso.
                    </li>
                    <li>
                      <strong>Propiedad Intelectual:</strong> Nuestras plantillas de documentos contienen contenido propietario y formato legal que tiene valor al momento de la entrega.
                    </li>
                  </ol>

                  <h2>3. Vista Previa Antes de Comprar</h2>
                  <p>
                    <strong>IMPORTANTE: ¡Siempre revise la vista previa antes de comprar!</strong>
                  </p>
                  <p>
                    Codec Document proporciona una función de vista previa GRATIS que le permite:
                  </p>
                  <ul>
                    <li>Ver el documento COMPLETO con su información completada</li>
                    <li>Revisar todas las secciones, cláusulas y lenguaje legal</li>
                    <li>Descargar una versión PDF con marca de agua para su revisión</li>
                    <li>Verificar que todos los campos estén correctamente completados</li>
                    <li>Asegurarse de que el documento cumpla con sus necesidades específicas</li>
                  </ul>
                  <p>
                    La vista previa le muestra EXACTAMENTE lo que recibirá, siendo la única diferencia la eliminación de la marca de agua después de la compra.
                  </p>
                  <p className="font-bold text-blue-900 bg-blue-50 p-4 rounded-lg">
                    Al realizar una compra, usted reconoce que ha revisado la vista previa completa y está satisfecho con el contenido y estructura del documento.
                  </p>

                  <h2>4. Qué Verificar Antes de Comprar</h2>
                  <p>
                    Antes de completar su compra, por favor verifique:
                  </p>
                  <ul>
                    <li>✓ Toda su información está ingresada correctamente (nombres, direcciones, fechas, montos, etc.)</li>
                    <li>✓ El tipo de documento es apropiado para sus necesidades específicas</li>
                    <li>✓ El documento cumple con los requisitos de su estado (si aplica)</li>
                    <li>✓ Todos los campos opcionales que quería incluir están completados</li>
                    <li>✓ El idioma (inglés/español) es correcto</li>
                    <li>✓ El formato y diseño son aceptables</li>
                    <li>✓ Entiende que esto es una plantilla y puede necesitar revisión de un abogado</li>
                  </ul>

                  <h2>5. Sin Excepciones</h2>
                  <p>
                    NO hacemos excepciones a esta política por ninguna razón, incluyendo pero no limitado a:
                  </p>
                  <ul>
                    <li>❌ "No leí la vista previa cuidadosamente"</li>
                    <li>❌ "Cometí un error al ingresar mi información"</li>
                    <li>❌ "Cambié de opinión"</li>
                    <li>❌ "Encontré un documento similar más barato en otro lugar"</li>
                    <li>❌ "Mi abogado dijo que no es adecuado"</li>
                    <li>❌ "Compré el documento equivocado por error"</li>
                    <li>❌ "El documento no cumple con mi situación legal específica"</li>
                    <li>❌ Problemas técnicos de su parte después de la compra</li>
                  </ul>

                  <h2>6. Problemas Técnicos Durante la Compra</h2>
                  <p>
                    Si experimenta problemas técnicos DURANTE el proceso de compra (ej. pago procesado pero documento no entregado), por favor contáctenos inmediatamente. Nosotros:
                  </p>
                  <ul>
                    <li>Verificaremos su compra con PayPal</li>
                    <li>Le proporcionaremos el documento por el que pagó</li>
                    <li>Ayudaremos con cualquier problema técnico de entrega</li>
                  </ul>
                  <p>
                    Sin embargo, esto NO constituye una política de reembolso. Nos aseguraremos de que reciba el producto que compró, pero no reembolsaremos su pago.
                  </p>

                  <h2>7. Disputas de PayPal y Contracargos</h2>
                  <p>
                    <strong>Por favor no presente disputas de PayPal o contracargos.</strong>
                  </p>
                  <p>
                    Si presenta una disputa o contracargo:
                  </p>
                  <ul>
                    <li>Proporcionaremos a PayPal evidencia de que previsualizó el documento antes de comprar</li>
                    <li>Proporcionaremos prueba de entrega (confirmación de descarga)</li>
                    <li>Haremos referencia a nuestra Política de No Reembolsos claramente establecida que usted aceptó</li>
                    <li>Presentar contracargos fraudulentos puede resultar en acción legal</li>
                  </ul>
                  <p>
                    Si tiene un problema técnico legítimo, por favor contáctenos directamente primero para que podamos resolverlo.
                  </p>

                  <h2>8. Aseguramiento de Calidad de Documentos</h2>
                  <p>
                    Aunque nos esforzamos por proporcionar plantillas de documentos de alta calidad y legalmente sólidas:
                  </p>
                  <ul>
                    <li>Nuestros documentos son plantillas, no asesoramiento legal personalizado</li>
                    <li>Las leyes varían por estado y cambian con el tiempo</li>
                    <li>Recomendamos que un abogado revise cualquier documento legal antes de usarlo</li>
                    <li>No somos responsables de la efectividad legal de los documentos</li>
                  </ul>
                  <p>
                    Esto está claramente establecido en nuestros Términos de Servicio y descargos legales, los cuales usted acepta antes de comprar.
                  </p>

                  <h2>9. Soporte al Cliente</h2>
                  <p>
                    Aunque no ofrecemos reembolsos, ESTAMOS comprometidos con la satisfacción del cliente:
                  </p>
                  <ul>
                    <li>Responderemos preguntas sobre cómo usar nuestros documentos</li>
                    <li>Ayudaremos con problemas técnicos al acceder a su documento comprado</li>
                    <li>Aclararemos cualquier confusión sobre características del documento</li>
                    <li>Damos la bienvenida a comentarios para mejorar nuestras plantillas</li>
                  </ul>
                  <p>
                    Por favor contáctenos si necesita asistencia, pero entienda que no podemos ofrecer reembolsos.
                  </p>

                  <h2>10. Reconocimiento</h2>
                  <p>
                    Al completar una compra en Codec Document, usted reconoce y acepta que:
                  </p>
                  <ul>
                    <li>✓ Ha leído y entendido esta Política de No Reembolsos</li>
                    <li>✓ Ha revisado la vista previa completa del documento antes de comprar</li>
                    <li>✓ Entiende que todas las ventas son finales sin reembolsos, devoluciones o cambios</li>
                    <li>✓ Acepta responsabilidad completa por verificar que el documento cumpla con sus necesidades antes de comprar</li>
                    <li>✓ No presentará disputas o contracargos por productos que fueron entregados según lo descrito</li>
                  </ul>

                  <h2>11. Descargo Legal</h2>
                  <p>
                    Esta Política de No Reembolsos es parte de nuestros Términos de Servicio. Al usar Codec Document, usted acepta estar obligado por esta política. Esta política puede ser actualizada en cualquier momento, y su uso continuado del servicio constituye aceptación de cualquier cambio.
                  </p>

                  <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6 mt-8">
                    <p className="font-bold text-yellow-900 mb-2">
                      ⚠️ Antes de Comprar - Lista de Verificación Final
                    </p>
                    <ul className="space-y-2 text-yellow-900">
                      <li>□ He previsualizando el documento COMPLETO con mi información</li>
                      <li>□ He verificado que toda mi información es correcta</li>
                      <li>□ Entiendo que esto es una plantilla y puede necesitar revisión de abogado</li>
                      <li>□ Entiendo que NO HAY REEMBOLSOS por ninguna razón</li>
                      <li>□ Estoy listo para hacer una compra final</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mt-8">
                    <p className="font-bold text-blue-900 mb-2">
                      ¿Preguntas? Contáctenos ANTES de Comprar
                    </p>
                    <p className="text-blue-800">
                      Si tiene alguna pregunta o inquietud sobre un documento, por favor contáctenos ANTES de hacer su compra. Estaremos felices de ayudarle a determinar si un documento es adecuado para sus necesidades - pero no podemos ofrecer reembolsos después de la compra.
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
