import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { documentTemplates } from '../data/templates';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { FileText, Shield, Zap, Check, MapPin, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';
import { getDocumentTranslation } from '../data/document-translations';
import { LanguageToggle } from '../components/language-toggle';
import { US_STATES, STATE_NAMES_ES } from '../data/state-variations';
import { getDocumentsForState, StateCode } from '../data/document-availability';
import { SEOHead } from '../components/seo-head';
import { StructuredData } from '../components/structured-data';
import { SITE_URL } from '../config/site';

export function HomePage() {
  const { t, language } = useLanguage();
  const [selectedState, setSelectedState] = useState<StateCode | 'ALL'>('ALL');
  const [filteredDocuments, setFilteredDocuments] = useState(documentTemplates);

  // Load saved state from sessionStorage on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem('selectedState');
    if (savedState && savedState !== 'ALL' && US_STATES.includes(savedState)) {
      setSelectedState(savedState as StateCode);
    }
  }, []);

  // Filter documents when state changes
  useEffect(() => {
    if (selectedState && selectedState !== 'ALL') {
      const available = getDocumentsForState(selectedState, documentTemplates);
      setFilteredDocuments(available);
      // Save to sessionStorage
      sessionStorage.setItem('selectedState', selectedState);
    } else {
      setFilteredDocuments(documentTemplates);
      sessionStorage.removeItem('selectedState');
    }
  }, [selectedState]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SEOHead
        title={language === 'en' 
          ? 'Codec Document - Legal Document Templates for USA | Residential Lease, Contracts & More'
          : 'Codec Document - Plantillas de Documentos Legales para USA | Arrendamiento, Contratos y Más'}
        description={language === 'en'
          ? 'Create professional legal documents online. State-specific residential lease agreements, business contracts, and legal forms. Free preview, instant download. Better than AI-generated templates.'
          : 'Crea documentos legales profesionales en línea. Contratos de arrendamiento residencial específicos por estado, contratos comerciales y formularios legales. Vista previa gratis, descarga instantánea.'}
        keywords={language === 'en'
          ? 'legal documents, residential lease agreement, rental contract, lease template, legal forms USA, state-specific legal documents, business contracts, legal templates, lease agreement California, lease agreement Texas, lease agreement Florida, lease agreement New York, professional legal documents, instant download legal forms'
          : 'documentos legales, contrato de arrendamiento residencial, contrato de renta, plantilla de arrendamiento, formularios legales USA, documentos legales por estado, contratos comerciales, plantillas legales, contrato de arrendamiento California, contrato de arrendamiento Texas, contrato de arrendamiento Florida, documentos legales profesionales'}
        canonicalUrl={typeof window !== 'undefined' ? window.location.origin : SITE_URL}
      />
      <StructuredData />
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="size-8 text-blue-600" />
              <h1 className="text-2xl font-bold">{t('header.title')}</h1>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                {t('header.subtitle')}
              </Badge>
              <LanguageToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-blue-500"></span>
            </span>
            {language === 'en' ? 'Professional legal documents, not AI-generated templates' : 'Documentos legales profesionales, no plantillas generadas por IA'}
          </div>
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('hero.title')}
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            {t('hero.subtitle')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 bg-white rounded-lg border shadow-sm">
              <Zap className="size-10 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">{t('hero.feature2')}</h3>
              <p className="text-sm text-slate-600">{language === 'en' ? 'Fill the form, see your document instantly with smart field validation' : 'Completa el formulario, ve tu documento instantáneamente con validación inteligente'}</p>
            </div>
            <div className="p-6 bg-white rounded-lg border shadow-sm">
              <FileText className="size-10 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">{t('hero.feature3')}</h3>
              <p className="text-sm text-slate-600">{language === 'en' ? 'Created by legal professionals, not generic AI that misses critical clauses' : 'Creados por profesionales legales, no por IA genérica que omite cláusulas críticas'}</p>
            </div>
            <div className="p-6 bg-white rounded-lg border shadow-sm">
              <Check className="size-10 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">{t('hero.feature4')}</h3>
              <p className="text-sm text-slate-600">{language === 'en' ? 'Preview with watermarks, edit after purchase, download as PDF' : 'Vista previa con marcas de agua, edita después de la compra, descarga como PDF'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Better Section */}
      <section className="bg-blue-50 py-12">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-8">
            {language === 'en' ? 'Why We\'re Better Than ChatGPT or Etsy Templates' : 'Por Qué Somos Mejores que ChatGPT o Plantillas de Etsy'}
          </h3>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-bold text-lg mb-3 text-blue-600">
                {language === 'en' ? 'vs. AI (ChatGPT, Gemini)' : 'vs. IA (ChatGPT, Gemini)'}
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="size-5 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{language === 'en' ? 'Legally vetted clauses' : 'Cláusulas verificadas legalmente'}</strong> - {language === 'en' ? 'AI often generates incomplete or contradictory terms' : 'La IA a menudo genera términos incompletos o contradictorios'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-5 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{language === 'en' ? 'State-specific compliance' : 'Cumplimiento específico por estado'}</strong> - {language === 'en' ? 'AI doesn\'t track jurisdiction requirements' : 'La IA no rastrea requisitos de jurisdicción'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-5 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{language === 'en' ? 'Professional formatting' : 'Formato profesional'}</strong> - {language === 'en' ? 'Consistent structure that courts recognize' : 'Estructura consistente que los tribunales reconocen'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-5 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{language === 'en' ? 'No hallucinations' : 'Sin alucinaciones'}</strong> - {language === 'en' ? 'Every clause is intentional, not AI-generated filler' : 'Cada cláusula es intencional, no relleno generado por IA'}
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-bold text-lg mb-3 text-blue-600">
                {language === 'en' ? 'vs. Etsy Templates' : 'vs. Plantillas de Etsy'}
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="size-5 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{language === 'en' ? 'Interactive customization' : 'Personalización interactiva'}</strong> - {language === 'en' ? 'Not just a Word doc with blanks' : 'No solo un documento de Word con espacios en blanco'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-5 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{language === 'en' ? 'Real-time preview' : 'Vista previa en tiempo real'}</strong> - {language === 'en' ? 'See exactly what you\'re getting before purchase' : 'Ve exactamente lo que obtendrás antes de comprar'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-5 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{language === 'en' ? 'Validation & guidance' : 'Validación y orientación'}</strong> - {language === 'en' ? 'Helpful tooltips and required field checks' : 'Consejos útiles y verificación de campos requeridos'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-5 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{language === 'en' ? 'Updated regularly' : 'Actualizado regularmente'}</strong> - {language === 'en' ? 'Our docs reflect current laws, not 2019 templates' : 'Nuestros documentos reflejan las leyes actuales, no plantillas de 2019'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* State Selector Section - PROMINENT */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-blue-200 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <MapPin className="size-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">
                {language === 'en' ? 'Select Your State' : 'Selecciona Tu Estado'}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {language === 'en' 
                  ? 'Legal documents vary by state. Select your state to see documents customized for your jurisdiction.'
                  : 'Los documentos legales varían según el estado. Selecciona tu estado para ver documentos personalizados para tu jurisdicción.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="state-selector" className="text-base font-semibold">
                  {language === 'en' ? 'Your State' : 'Tu Estado'}
                </Label>
                <Select value={selectedState} onValueChange={(value) => setSelectedState(value as StateCode)}>
                  <SelectTrigger id="state-selector" className="w-full h-12 text-base">
                    <SelectValue placeholder={language === 'en' ? 'Choose a state...' : 'Elige un estado...'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="ALL" className="text-slate-400 italic">
                      {language === 'en' ? 'Show all documents (all states)' : 'Mostrar todos los documentos (todos los estados)'}
                    </SelectItem>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {language === 'es' ? (STATE_NAMES_ES[state] || state) : state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedState && selectedState !== 'ALL' ? (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="flex items-start gap-3">
                    <Check className="size-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">
                        {language === 'en' 
                          ? `Showing ${filteredDocuments.length} documents for ${selectedState}`
                          : `Mostrando ${filteredDocuments.length} documentos para ${STATE_NAMES_ES[selectedState] || selectedState}`}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        {language === 'en'
                          ? `All documents below are customized with ${selectedState}-specific legal requirements and clauses.`
                          : `Todos los documentos a continuación están personalizados con los requisitos legales y cláusulas específicas de ${STATE_NAMES_ES[selectedState] || selectedState}.`}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="size-6 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900">
                        {language === 'en' 
                          ? `Showing all ${documentTemplates.length} documents`
                          : `Mostrando todos los ${documentTemplates.length} documentos`}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        {language === 'en'
                          ? 'Select a state above to see documents specific to your jurisdiction.'
                          : 'Selecciona un estado arriba para ver documentos específicos de tu jurisdicción.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Available Documents */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">
          {language === 'en' ? 'Available Legal Documents' : 'Documentos Legales Disponibles'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredDocuments.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-all hover:scale-[1.02] duration-200">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg flex-1">{getDocumentTranslation(template.id, 'name', language)}</CardTitle>
                  <Badge variant="outline" className="text-xs shrink-0 ml-2">
                    ${template.price}
                  </Badge>
                </div>
                <CardDescription className="text-sm line-clamp-3">
                  {getDocumentTranslation(template.id, 'desc', language)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <FileText className="size-4" />
                    <span>{template.fields.length} {language === 'en' ? 'customizable fields' : 'campos personalizables'}</span>
                  </div>
                  <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                    {language === 'en' ? '✓ Preview for free • ✓ Instant download after purchase' : '✓ Vista previa gratis • ✓ Descarga instantánea después de la compra'}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Link to={`/generate/${template.id}`} className="w-full">
                  <Button className="w-full" size="lg">
                    {language === 'en' ? 'Create Document →' : 'Crear Documento →'}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          {/* Legal Terms */}
          <div className="max-w-5xl mx-auto space-y-6 mb-8">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h4 className="font-bold text-lg mb-3">{language === 'en' ? 'Terms of Service' : 'Términos de Servicio'}</h4>
              <div className="text-sm text-slate-600 space-y-3">
                <p>
                  {language === 'en' 
                    ? 'By using Codec Document, you agree to these terms. All document templates are provided for informational and educational purposes only. You are purchasing access to customizable document templates, not legal advice or representation.'
                    : 'Al usar Codec Document, aceptas estos términos. Todas las plantillas de documentos se proporcionan solo con fines informativos y educativos. Estás comprando acceso a plantillas de documentos personalizables, no asesoramiento legal ni representación.'}
                </p>
                <p>
                  {language === 'en'
                    ? 'Payment Processing: All payments are securely processed through PayPal. We do not store your payment information on our servers. All transactions are encrypted and secure.'
                    : 'Procesamiento de Pagos: Todos los pagos se procesan de forma segura a través de PayPal. No almacenamos tu información de pago en nuestros servidores. Todas las transacciones están encriptadas y son seguras.'}
                </p>
                <p>
                  {language === 'en'
                    ? 'No Refund Policy: All sales are final. We provide a complete watermarked preview of every document before purchase, allowing you to review the entire content and ensure it meets your needs. By completing your purchase, you acknowledge that you have reviewed the preview and accept that no refunds will be issued.'
                    : 'Política de No Reembolso: Todas las ventas son finales. Proporcionamos una vista previa completa con marca de agua de cada documento antes de la compra, permitiéndote revisar todo el contenido y asegurar que cumple con tus necesidades. Al completar tu compra, reconoces que has revisado la vista previa y aceptas que no se emitirán reembolsos.'}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h4 className="font-bold text-lg mb-3">{language === 'en' ? 'Legal Disclaimer' : 'Aviso Legal'}</h4>
              <div className="text-sm text-slate-600 space-y-3">
                <p>
                  <strong>{language === 'en' ? 'NOT A LAW FIRM:' : 'NO SOMOS UN BUFETE DE ABOGADOS:'}</strong> {language === 'en'
                    ? 'Codec Document is not a law firm and does not provide legal advice, opinions, or recommendations. The documents provided are generic templates and may not be suitable for your specific situation.'
                    : 'Codec Document no es un bufete de abogados y no proporciona asesoramiento legal, opiniones ni recomendaciones. Los documentos proporcionados son plantillas genéricas y pueden no ser adecuados para tu situación específica.'}
                </p>
                <p>
                  <strong>{language === 'en' ? 'ATTORNEY CONSULTATION REQUIRED:' : 'SE REQUIERE CONSULTA CON ABOGADO:'}</strong> {language === 'en'
                    ? 'You should consult with a qualified attorney licensed in your jurisdiction before using any legal document. Laws vary significantly by state and change frequently. An attorney can ensure the document meets your specific needs and complies with current laws.'
                    : 'Debes consultar con un abogado calificado con licencia en tu jurisdicción antes de usar cualquier documento legal. Las leyes varían significativamente por estado y cambian con frecuencia. Un abogado puede asegurarse de que el documento cumpla con tus necesidades específicas y las leyes actuales.'}
                </p>
                <p>
                  <strong>{language === 'en' ? 'NO WARRANTIES:' : 'SIN GARANTÍAS:'}</strong> {language === 'en'
                    ? 'We provide these templates "AS IS" without warranties of any kind, express or implied, including but not limited to fitness for a particular purpose, accuracy, or completeness. We are not liable for any damages arising from use of these documents.'
                    : 'Proporcionamos estas plantillas "TAL CUAL" sin garantías de ningún tipo, expresas o implícitas, incluidas, entre otras, la idoneidad para un propósito particular, precisión o integridad. No somos responsables de ningún daño derivado del uso de estos documentos.'}
                </p>
                <p>
                  <strong>{language === 'en' ? 'USER RESPONSIBILITY:' : 'RESPONSABILIDAD DEL USUARIO:'}</strong> {language === 'en'
                    ? 'You are solely responsible for ensuring that any document you create complies with all applicable federal, state, and local laws. You assume all risks associated with the use of these templates.'
                    : 'Eres el único responsable de asegurarte de que cualquier documento que crees cumpla con todas las leyes federales, estatales y locales aplicables. Asumes todos los riesgos asociados con el uso de estas plantillas.'}
                </p>
                <p>
                  <strong>{language === 'en' ? 'ATTORNEY-CLIENT PRIVILEGE:' : 'PRIVILEGIO ABOGADO-CLIENTE:'}</strong> {language === 'en'
                    ? 'No attorney-client relationship is created by using this service. Communications with Codec Document are not protected by attorney-client privilege.'
                    : 'No se crea ninguna relación abogado-cliente al usar este servicio. Las comunicaciones con Codec Document no están protegidas por el privilegio abogado-cliente.'}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h4 className="font-bold text-lg mb-3">{language === 'en' ? 'Privacy & Data Protection' : 'Privacidad y Protección de Datos'}</h4>
              <div className="text-sm text-slate-600 space-y-3">
                <p>
                  {language === 'en'
                    ? 'We take your privacy seriously. Your document data is encrypted and stored securely. We will never sell your personal information to third parties. We collect only the minimum information necessary to provide our service.'
                    : 'Nos tomamos en serio tu privacidad. Los datos de tus documentos están encriptados y almacenados de forma segura. Nunca venderemos tu información personal a terceros. Recopilamos solo la información mínima necesaria para proporcionar nuestro servicio.'}
                </p>
                <p>
                  {language === 'en'
                    ? 'Payment information is processed directly by Stripe and never touches our servers. We comply with applicable data protection regulations including GDPR and CCPA.'
                    : 'La información de pago es procesada directamente por Stripe y nunca toca nuestros servidores. Cumplimos con las regulaciones de protección de datos aplicables, incluidas GDPR y CCPA.'}
                </p>
              </div>
            </div>
          </div>

          {/* Copyright and Credits */}
          <div className="text-center border-t pt-6">
            <p className="text-sm text-slate-600 mb-2">
              © 2026 Codec Document. {language === 'en' ? 'All rights reserved.' : 'Todos los derechos reservados.'}
            </p>
            <p className="text-sm text-slate-500">
              {language === 'en' ? 'Designed and developed by' : 'Diseñado y desarrollado por'}{' '}
              <a 
                href="https://codecstudio.online/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Codec Studio
              </a>
            </p>
            <p className="text-xs text-slate-400 mt-3">
              {language === 'en'
                ? 'Secure payments powered by PayPal'
                : 'Pagos seguros proporcionados por PayPal'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}