import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "./components/auth/protected-route";
import { AdminRoute } from "./components/auth/AdminRoute";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";

// Lazy-loaded route components -- each page's JS downloads only when
// that route is actually visited, instead of bundling all ~150 pages
// into the initial load. See App.tsx for the <Suspense> boundary.
const ModernHomePage = lazy(() => import("./pages/modern-home-page").then((m) => ({ default: m.ModernHomePage })));
const DocumentGeneratorPage = lazy(() => import("./pages/document-generator-page").then((m) => ({ default: m.DocumentGeneratorPage })));
const PreviewPage = lazy(() => import("./pages/preview-page").then((m) => ({ default: m.PreviewPage })));
const CheckoutPage = lazy(() => import("./pages/checkout-page").then((m) => ({ default: m.CheckoutPage })));
const NotFoundPage = lazy(() => import("./pages/not-found-page").then((m) => ({ default: m.NotFoundPage })));
const TermsOfServicePage = lazy(() => import("./pages/terms-of-service").then((m) => ({ default: m.TermsOfServicePage })));
const PrivacyPolicyPage = lazy(() => import("./pages/privacy-policy").then((m) => ({ default: m.PrivacyPolicyPage })));
const RefundPolicyPage = lazy(() => import("./pages/refund-policy").then((m) => ({ default: m.RefundPolicyPage })));
const PaymentSuccessPage = lazy(() => import("./pages/payment-success-page").then((m) => ({ default: m.PaymentSuccessPage })));
const GuestSignPage = lazy(() => import("./pages/guest-sign-page").then((m) => ({ default: m.GuestSignPage })));
const QuickSignPage = lazy(() => import("./pages/quick-sign-page").then((m) => ({ default: m.QuickSignPage })));
const SignTransactionPage = lazy(() => import("./pages/sign-transaction-page"));
const MyDocumentsPage = lazy(() => import("./pages/my-documents-page").then((m) => ({ default: m.MyDocumentsPage })));
const MyTemplatesPage = lazy(() => import("./pages/my-templates-page").then((m) => ({ default: m.MyTemplatesPage })));
const MyTemplateEditorPage = lazy(() => import("./pages/my-template-editor-page").then((m) => ({ default: m.MyTemplateEditorPage })));
const MyTemplateFillPage = lazy(() => import("./pages/my-template-fill-page").then((m) => ({ default: m.MyTemplateFillPage })));
const MyBrandingPage = lazy(() => import("./pages/my-branding-page").then((m) => ({ default: m.MyBrandingPage })));
const MyCompanyPage = lazy(() => import("./pages/my-company-page").then((m) => ({ default: m.MyCompanyPage })));
const MyContactsPage = lazy(() => import("./pages/my-contacts-page").then((m) => ({ default: m.MyContactsPage })));
const MyQuotesPage = lazy(() => import("./pages/my-quotes-page").then((m) => ({ default: m.MyQuotesPage })));
const MyQuoteEditorPage = lazy(() => import("./pages/my-quote-editor-page").then((m) => ({ default: m.MyQuoteEditorPage })));
const ElectronicSignaturePage = lazy(() => import("./pages/electronic-signature-page").then((m) => ({ default: m.ElectronicSignaturePage })));
const FreeLegalDocumentsLanding = lazy(() => import("./pages/landings/free-legal-documents"));
const ElectronicSignatureLanding = lazy(() => import("./pages/landings/electronic-signature"));
const OnlineLeaseAgreementLanding = lazy(() => import("./pages/landings/online-lease-agreement"));
const NdaGeneratorLanding = lazy(() => import("./pages/landings/nda-generator"));
const IndependentContractorLanding = lazy(() => import("./pages/landings/independent-contractor-agreement"));
const VehicleBillOfSaleLanding = lazy(() => import("./pages/landings/billing-vehicle-bill-of-sale"));
const PromissoryNoteLanding = lazy(() => import("./pages/landings/promissory-note"));
const StateDocumentLanding = lazy(() => import("./pages/landings/state-document"));
const CaliforniaLegalDocuments = lazy(() => import("./pages/landings/california-legal-documents"));
const TexasLegalDocuments = lazy(() => import("./pages/landings/texas-legal-documents"));
const FloridaLegalDocuments = lazy(() => import("./pages/landings/florida-legal-documents"));
const NewYorkLegalDocuments = lazy(() => import("./pages/landings/new-york-legal-documents"));
const IllinoisLegalDocuments = lazy(() => import("./pages/landings/illinois-legal-documents"));
const PennsylvaniaLegalDocuments = lazy(() => import("./pages/landings/pennsylvania-legal-documents"));
const OhioLegalDocuments = lazy(() => import("./pages/landings/ohio-legal-documents"));
const GeorgiaLegalDocuments = lazy(() => import("./pages/landings/georgia-legal-documents"));
const NorthCarolinaLegalDocuments = lazy(() => import("./pages/landings/north-carolina-legal-documents"));
const MichiganLegalDocuments = lazy(() => import("./pages/landings/michigan-legal-documents"));
const NewJerseyLegalDocuments = lazy(() => import("./pages/landings/new-jersey-legal-documents"));
const VirginiaLegalDocuments = lazy(() => import("./pages/landings/virginia-legal-documents"));
const NdaCalifornia = lazy(() => import("./pages/landings/nda-california"));
const NdaTexas = lazy(() => import("./pages/landings/nda-texas"));
const NdaFlorida = lazy(() => import("./pages/landings/nda-florida"));
const NdaNewYork = lazy(() => import("./pages/landings/nda-new-york"));
const NdaIllinois = lazy(() => import("./pages/landings/nda-illinois"));
const NdaPennsylvania = lazy(() => import("./pages/landings/nda-pennsylvania"));
const LeaseAgreementCalifornia = lazy(() => import("./pages/landings/lease-agreement-california"));
const LeaseAgreementTexas = lazy(() => import("./pages/landings/lease-agreement-texas"));
const LeaseAgreementFlorida = lazy(() => import("./pages/landings/lease-agreement-florida"));
const LeaseAgreementNewYork = lazy(() => import("./pages/landings/lease-agreement-new-york"));
const LeaseAgreementIllinois = lazy(() => import("./pages/landings/lease-agreement-illinois"));
const LeaseAgreementPennsylvania = lazy(() => import("./pages/landings/lease-agreement-pennsylvania"));
const IndependentContractorCalifornia = lazy(() => import("./pages/landings/independent-contractor-california"));
const IndependentContractorTexas = lazy(() => import("./pages/landings/independent-contractor-texas"));
const IndependentContractorFlorida = lazy(() => import("./pages/landings/independent-contractor-florida"));
const IndependentContractorNewYork = lazy(() => import("./pages/landings/independent-contractor-new-york"));
const IndependentContractorIllinois = lazy(() => import("./pages/landings/independent-contractor-illinois"));
const IndependentContractorPennsylvania = lazy(() => import("./pages/landings/independent-contractor-pennsylvania"));
const ServiceAgreementCalifornia = lazy(() => import("./pages/landings/service-agreement-california"));
const ServiceAgreementTexas = lazy(() => import("./pages/landings/service-agreement-texas"));
const ServiceAgreementFlorida = lazy(() => import("./pages/landings/service-agreement-florida"));
const ServiceAgreementNewYork = lazy(() => import("./pages/landings/service-agreement-new-york"));
const ServiceAgreementIllinois = lazy(() => import("./pages/landings/service-agreement-illinois"));
const ServiceAgreementPennsylvania = lazy(() => import("./pages/landings/service-agreement-pennsylvania"));
const PromissoryNoteCalifornia = lazy(() => import("./pages/landings/promissory-note-california"));
const PromissoryNoteTexas = lazy(() => import("./pages/landings/promissory-note-texas"));
const PromissoryNoteFlorida = lazy(() => import("./pages/landings/promissory-note-florida"));
const PromissoryNoteNewYork = lazy(() => import("./pages/landings/promissory-note-new-york"));
const PromissoryNoteIllinois = lazy(() => import("./pages/landings/promissory-note-illinois"));
const PromissoryNotePennsylvania = lazy(() => import("./pages/landings/promissory-note-pennsylvania"));
const VehicleBillOfSaleCalifornia = lazy(() => import("./pages/landings/vehicle-bill-of-sale-california"));
const VehicleBillOfSaleTexas = lazy(() => import("./pages/landings/vehicle-bill-of-sale-texas"));
const VehicleBillOfSaleFlorida = lazy(() => import("./pages/landings/vehicle-bill-of-sale-florida"));
const VehicleBillOfSaleNewYork = lazy(() => import("./pages/landings/vehicle-bill-of-sale-new-york"));
const VehicleBillOfSaleIllinois = lazy(() => import("./pages/landings/vehicle-bill-of-sale-illinois"));
const VehicleBillOfSalePennsylvania = lazy(() => import("./pages/landings/vehicle-bill-of-sale-pennsylvania"));
const NdaOhio = lazy(() => import("./pages/landings/nda-ohio"));
const NdaGeorgia = lazy(() => import("./pages/landings/nda-georgia"));
const NdaNorthCarolina = lazy(() => import("./pages/landings/nda-north-carolina"));
const NdaMichigan = lazy(() => import("./pages/landings/nda-michigan"));
const NdaNewJersey = lazy(() => import("./pages/landings/nda-new-jersey"));
const NdaVirginia = lazy(() => import("./pages/landings/nda-virginia"));
const LeaseAgreementOhio = lazy(() => import("./pages/landings/lease-agreement-ohio"));
const LeaseAgreementGeorgia = lazy(() => import("./pages/landings/lease-agreement-georgia"));
const LeaseAgreementNorthCarolina = lazy(() => import("./pages/landings/lease-agreement-north-carolina"));
const LeaseAgreementMichigan = lazy(() => import("./pages/landings/lease-agreement-michigan"));
const LeaseAgreementNewJersey = lazy(() => import("./pages/landings/lease-agreement-new-jersey"));
const LeaseAgreementVirginia = lazy(() => import("./pages/landings/lease-agreement-virginia"));
const IndependentContractorOhio = lazy(() => import("./pages/landings/independent-contractor-ohio"));
const IndependentContractorGeorgia = lazy(() => import("./pages/landings/independent-contractor-georgia"));
const IndependentContractorNorthCarolina = lazy(() => import("./pages/landings/independent-contractor-north-carolina"));
const IndependentContractorMichigan = lazy(() => import("./pages/landings/independent-contractor-michigan"));
const IndependentContractorNewJersey = lazy(() => import("./pages/landings/independent-contractor-new-jersey"));
const IndependentContractorVirginia = lazy(() => import("./pages/landings/independent-contractor-virginia"));
const ServiceAgreementOhio = lazy(() => import("./pages/landings/service-agreement-ohio"));
const ServiceAgreementGeorgia = lazy(() => import("./pages/landings/service-agreement-georgia"));
const ServiceAgreementNorthCarolina = lazy(() => import("./pages/landings/service-agreement-north-carolina"));
const ServiceAgreementMichigan = lazy(() => import("./pages/landings/service-agreement-michigan"));
const ServiceAgreementNewJersey = lazy(() => import("./pages/landings/service-agreement-new-jersey"));
const ServiceAgreementVirginia = lazy(() => import("./pages/landings/service-agreement-virginia"));
const PromissoryNoteOhio = lazy(() => import("./pages/landings/promissory-note-ohio"));
const PromissoryNoteGeorgia = lazy(() => import("./pages/landings/promissory-note-georgia"));
const PromissoryNoteNorthCarolina = lazy(() => import("./pages/landings/promissory-note-north-carolina"));
const PromissoryNoteMichigan = lazy(() => import("./pages/landings/promissory-note-michigan"));
const PromissoryNoteNewJersey = lazy(() => import("./pages/landings/promissory-note-new-jersey"));
const PromissoryNoteVirginia = lazy(() => import("./pages/landings/promissory-note-virginia"));
const VehicleBillOfSaleOhio = lazy(() => import("./pages/landings/vehicle-bill-of-sale-ohio"));
const VehicleBillOfSaleGeorgia = lazy(() => import("./pages/landings/vehicle-bill-of-sale-georgia"));
const VehicleBillOfSaleNorthCarolina = lazy(() => import("./pages/landings/vehicle-bill-of-sale-north-carolina"));
const VehicleBillOfSaleMichigan = lazy(() => import("./pages/landings/vehicle-bill-of-sale-michigan"));
const VehicleBillOfSaleNewJersey = lazy(() => import("./pages/landings/vehicle-bill-of-sale-new-jersey"));
const VehicleBillOfSaleVirginia = lazy(() => import("./pages/landings/vehicle-bill-of-sale-virginia"));
const FirmaElectronicaColombia = lazy(() => import("./pages/landings/firma-electronica-colombia"));
const FirmaElectronicaMexico = lazy(() => import("./pages/landings/firma-electronica-mexico"));
const FirmaElectronicaChile = lazy(() => import("./pages/landings/firma-electronica-chile"));
const FirmaElectronicaPeru = lazy(() => import("./pages/landings/firma-electronica-peru"));
const FirmaElectronicaArgentina = lazy(() => import("./pages/landings/firma-electronica-argentina"));
const FirmaElectronicaEcuador = lazy(() => import("./pages/landings/firma-electronica-ecuador"));
const FirmaElectronicaGratis = lazy(() => import("./pages/landings/firma-electronica-gratis"));
const FirmarPdfGratis = lazy(() => import("./pages/landings/firmar-pdf-gratis"));
const FirmaDigitalGratis = lazy(() => import("./pages/landings/firma-digital-gratis"));
const FirmarDocumentosOnlineGratis = lazy(() => import("./pages/landings/firmar-documentos-online-gratis"));
const DocumentosLegalesGratis = lazy(() => import("./pages/landings/documentos-legales-gratis"));
const CrearDocumentosOnlineGratis = lazy(() => import("./pages/landings/crear-documentos-online-gratis"));
const CertificarDocumentosOnline = lazy(() => import("./pages/landings/certificar-documentos-online"));
const FirmaElectronicaParaAbogados = lazy(() => import("./pages/landings/firma-electronica-para-abogados"));
const FirmaElectronicaParaInmobiliarias = lazy(() => import("./pages/landings/firma-electronica-para-inmobiliarias"));
const FirmaElectronicaParaEmpresas = lazy(() => import("./pages/landings/firma-electronica-para-empresas"));
const FirmaElectronicaParaRecursosHumanos = lazy(() => import("./pages/landings/firma-electronica-para-recursos-humanos"));
const FirmaElectronicaParaFreelancers = lazy(() => import("./pages/landings/firma-electronica-para-freelancers"));
const FirmaElectronicaParaConstructores = lazy(() => import("./pages/landings/firma-electronica-para-constructores"));
const FirmaElectronicaParaContadores = lazy(() => import("./pages/landings/firma-electronica-para-contadores"));
const FirmaElectronicaParaConsultores = lazy(() => import("./pages/landings/firma-electronica-para-consultores"));
const SanJoseCalifornia = lazy(() => import("./pages/landings/san-jose-california"));
const NdaSanJoseCalifornia = lazy(() => import("./pages/landings/nda-san-jose-california"));
const LeaseAgreementSanJoseCalifornia = lazy(() => import("./pages/landings/lease-agreement-san-jose-california"));
const IndependentContractorSanJoseCalifornia = lazy(() => import("./pages/landings/independent-contractor-san-jose-california"));
const ServiceAgreementSanJoseCalifornia = lazy(() => import("./pages/landings/service-agreement-san-jose-california"));
const PromissoryNoteSanJoseCalifornia = lazy(() => import("./pages/landings/promissory-note-san-jose-california"));
const VehicleBillOfSaleSanJoseCalifornia = lazy(() => import("./pages/landings/vehicle-bill-of-sale-san-jose-california"));
// Smart Quotes -- 10 paginas SEO (5 EEUU en ingles, 5 LatAm en espanol,
// ver quote-seo-content.ts).
const QuoteGeneratorLanding = lazy(() => import("./pages/landings/quote-generator"));
const ProposalGeneratorLanding = lazy(() => import("./pages/landings/proposal-generator"));
const BusinessEstimateGeneratorLanding = lazy(() => import("./pages/landings/business-estimate-generator"));
const ProfessionalQuoteTemplateLanding = lazy(() => import("./pages/landings/professional-quote-template"));
const CommercialProposalGeneratorLanding = lazy(() => import("./pages/landings/commercial-proposal-generator"));
const CotizadorOnlineLanding = lazy(() => import("./pages/landings/cotizador-online"));
const CrearCotizacionLanding = lazy(() => import("./pages/landings/crear-cotizacion"));
const PropuestaComercialLanding = lazy(() => import("./pages/landings/propuesta-comercial"));
const GeneradorDeCotizacionesLanding = lazy(() => import("./pages/landings/generador-de-cotizaciones"));
const CotizacionProfesionalLanding = lazy(() => import("./pages/landings/cotizacion-profesional"));
const MobileDashboardHome = lazy(() => import("./pages/mobile/MobileDashboardHome").then((m) => ({ default: m.MobileDashboardHome })));
const MobileTemplates = lazy(() => import("./pages/mobile/MobileTemplates").then((m) => ({ default: m.MobileTemplates })));
const MobileSignatures = lazy(() => import("./pages/mobile/MobileSignatures").then((m) => ({ default: m.MobileSignatures })));
const MobileDocuments = lazy(() => import("./pages/mobile/MobileDocuments").then((m) => ({ default: m.MobileDocuments })));
const MobileProfile = lazy(() => import("./pages/mobile/MobileProfile").then((m) => ({ default: m.MobileProfile })));
const MobileNotifications = lazy(() => import("./pages/mobile/MobileNotifications").then((m) => ({ default: m.MobileNotifications })));
const MobileSettings = lazy(() => import("./pages/mobile/MobileSettings").then((m) => ({ default: m.MobileSettings })));
const MobileAdminAnalytics = lazy(() => import("./pages/mobile/MobileAdminAnalytics").then((m) => ({ default: m.MobileAdminAnalytics })));
const DesktopDashboardHome = lazy(() => import("./pages/desktop/DesktopDashboardHome").then((m) => ({ default: m.DesktopDashboardHome })));
const DesktopDocuments = lazy(() => import("./pages/desktop/DesktopDocuments").then((m) => ({ default: m.DesktopDocuments })));
const DesktopSignatures = lazy(() => import("./pages/desktop/DesktopSignatures").then((m) => ({ default: m.DesktopSignatures })));
const DesktopTemplates = lazy(() => import("./pages/desktop/DesktopTemplates").then((m) => ({ default: m.DesktopTemplates })));
const DesktopProfile = lazy(() => import("./pages/desktop/DesktopProfile").then((m) => ({ default: m.DesktopProfile })));
const DesktopSettings = lazy(() => import("./pages/desktop/DesktopSettings").then((m) => ({ default: m.DesktopSettings })));
const DesktopNotifications = lazy(() => import("./pages/desktop/DesktopNotifications").then((m) => ({ default: m.DesktopNotifications })));
const DesktopAI = lazy(() => import("./pages/desktop/DesktopAI").then((m) => ({ default: m.DesktopAI })));
const DesktopAdminAnalytics = lazy(() => import("./pages/desktop/DesktopAdminAnalytics").then((m) => ({ default: m.DesktopAdminAnalytics })));
// Fase 6 -- ciudad San Jose, California (mismo contenido legal real de
// California, solo el <title>/meta de Google nombra la ciudad -- ver
// city-seo-content.ts).

// Blog / content marketing -- 20 articulos educativos (10 en ingles para
// EEUU, 10 en espanol para LatAm) + indice -- ver article-content.ts.
const BlogIndex = lazy(() => import("./pages/landings/blog-index"));
const BlogWhyDigitalSignaturesMatter2026 = lazy(() => import("./pages/landings/blog-why-digital-signatures-matter-2026"));
const BlogElectronicSignatureVsDigitalSignature = lazy(() => import("./pages/landings/blog-electronic-signature-vs-digital-signature"));
const BlogWhatIsAnNda = lazy(() => import("./pages/landings/blog-what-is-an-nda"));
const BlogESignaturesForRealEstate = lazy(() => import("./pages/landings/blog-e-signatures-for-real-estate"));
const BlogESignaturesForBanksFinancialInstitutions = lazy(() => import("./pages/landings/blog-e-signatures-for-banks-financial-institutions"));
const BlogEsignActLegalValidityUs = lazy(() => import("./pages/landings/blog-esign-act-legal-validity-us"));
const BlogFreeESignatureSoftwareSmallBusiness = lazy(() => import("./pages/landings/blog-free-e-signature-software-small-business"));
const BlogHiddenCostOfPaperContracts = lazy(() => import("./pages/landings/blog-hidden-cost-of-paper-contracts"));
const BlogHowToSendDocumentForSignatureOnline = lazy(() => import("./pages/landings/blog-how-to-send-document-for-signature-online"));
const BlogDigitalSignaturesForHrOnboarding = lazy(() => import("./pages/landings/blog-digital-signatures-for-hr-onboarding"));
const BlogFirmaDigitalEmpresas2026 = lazy(() => import("./pages/landings/blog-firma-digital-empresas-2026"));
const BlogFirmaElectronicaVsFirmaDigital = lazy(() => import("./pages/landings/blog-firma-electronica-vs-firma-digital"));
const BlogQueEsUnNdaAcuerdoConfidencialidad = lazy(() => import("./pages/landings/blog-que-es-un-nda-acuerdo-confidencialidad"));
const BlogFirmaElectronicaParaInmobiliarias = lazy(() => import("./pages/landings/blog-firma-electronica-para-inmobiliarias"));
const BlogFirmaElectronicaParaBancos = lazy(() => import("./pages/landings/blog-firma-electronica-para-bancos"));
const BlogValidezLegalFirmaElectronicaLatinoamerica = lazy(() => import("./pages/landings/blog-validez-legal-firma-electronica-latinoamerica"));
const BlogFirmaElectronicaGratisParaPymes = lazy(() => import("./pages/landings/blog-firma-electronica-gratis-para-pymes"));
const BlogCostoOcultoDelPapelEnEmpresas = lazy(() => import("./pages/landings/blog-costo-oculto-del-papel-en-empresas"));
const BlogComoEnviarDocumentoParaFirmaOnline = lazy(() => import("./pages/landings/blog-como-enviar-documento-para-firma-online"));
const BlogFirmaElectronicaParaRecursosHumanos = lazy(() => import("./pages/landings/blog-firma-electronica-para-recursos-humanos"));
// Pilot article under the new problem-first / E-E-A-T content standard (see feedback_seo_article_standard memory).
const BlogReducirTiempoFirmaContratos = lazy(() => import("./pages/landings/blog-reducir-tiempo-firma-contratos"));
const BlogComoEvitarPerderVentasPorDemorasEnFirma = lazy(() => import("./pages/landings/blog-como-evitar-perder-ventas-por-demoras-en-firma"));
const BlogNdaUnilateralVsBilateral = lazy(() => import("./pages/landings/blog-nda-unilateral-vs-bilateral"));
const BlogErroresComunesAlRedactarUnNda = lazy(() => import("./pages/landings/blog-errores-comunes-al-redactar-un-nda"));
const BlogQuePasaSiRompenUnNda = lazy(() => import("./pages/landings/blog-que-pasa-si-rompen-un-nda"));
const BlogComoAutomatizarContratosEnUnaInmobiliariaPequena = lazy(() => import("./pages/landings/blog-como-automatizar-contratos-en-una-inmobiliaria-pequena"));
const BlogComoProtegerseComoContratistaIndependiente = lazy(() => import("./pages/landings/blog-como-protegerse-como-contratista-independiente"));
const BlogAhorrarHorasEliminandoPapelEnTuEmpresa = lazy(() => import("./pages/landings/blog-ahorrar-horas-eliminando-papel-en-tu-empresa"));
const BlogComoOrganizarDocumentosLegalesDeTuEmpresa = lazy(() => import("./pages/landings/blog-como-organizar-documentos-legales-de-tu-empresa"));
const BlogErroresComunesEnContratoDeArrendamiento = lazy(() => import("./pages/landings/blog-errores-comunes-en-contrato-de-arrendamiento"));
const BlogComoVerificarIdentidadDeUnFirmante = lazy(() => import("./pages/landings/blog-como-verificar-identidad-de-un-firmante"));
const BlogStopLosingSalesBecauseOfSlowContracts = lazy(() => import("./pages/landings/blog-stop-losing-sales-because-of-slow-contracts"));
const BlogWhatHappensIfSomeoneBreaksAnNda = lazy(() => import("./pages/landings/blog-what-happens-if-someone-breaks-an-nda"));
const BlogIndependentContractorVsEmployeePaperwork = lazy(() => import("./pages/landings/blog-independent-contractor-vs-employee-paperwork"));
const BlogHowFreelancersCanProtectThemselvesWithAContract = lazy(() => import("./pages/landings/blog-how-freelancers-can-protect-themselves-with-a-contract"));
const BlogRealCostOfNoWrittenContract = lazy(() => import("./pages/landings/blog-real-cost-of-no-written-contract"));
const BlogSimpleDocumentWorkflowSmallCompany = lazy(() => import("./pages/landings/blog-simple-document-workflow-small-company"));
const BlogHowToScreenTenantsAndDraftLeases = lazy(() => import("./pages/landings/blog-how-to-screen-tenants-and-draft-leases"));
const BlogWhatToKnowBeforeSigningCommercialLease = lazy(() => import("./pages/landings/blog-what-to-know-before-signing-commercial-lease"));
const BlogHowToWriteAServiceAgreementThatProtectsYou = lazy(() => import("./pages/landings/blog-how-to-write-a-service-agreement-that-protects-you"));
const BlogHowToVetAClientBeforeSigningAContract = lazy(() => import("./pages/landings/blog-how-to-vet-a-client-before-signing-a-contract"));

function ProtectedMyDocumentsPage() {
  return (
    <ProtectedRoute>
      <MyDocumentsPage />
    </ProtectedRoute>
  );
}

function ProtectedMyTemplatesPage() {
  return (
    <ProtectedRoute>
      <MyTemplatesPage />
    </ProtectedRoute>
  );
}

function ProtectedMyTemplateEditorPage() {
  return (
    <ProtectedRoute>
      <MyTemplateEditorPage />
    </ProtectedRoute>
  );
}

function ProtectedMyTemplateFillPage() {
  return (
    <ProtectedRoute>
      <MyTemplateFillPage />
    </ProtectedRoute>
  );
}

function ProtectedMyBrandingPage() {
  return (
    <ProtectedRoute>
      <MyBrandingPage />
    </ProtectedRoute>
  );
}

function ProtectedMyCompanyPage() {
  return (
    <ProtectedRoute>
      <MyCompanyPage />
    </ProtectedRoute>
  );
}

function ProtectedMyContactsPage() {
  return (
    <ProtectedRoute>
      <MyContactsPage />
    </ProtectedRoute>
  );
}

function ProtectedMyQuotesPage() {
  return (
    <ProtectedRoute>
      <MyQuotesPage />
    </ProtectedRoute>
  );
}

function ProtectedMyQuoteEditorPage() {
  return (
    <ProtectedRoute>
      <MyQuoteEditorPage />
    </ProtectedRoute>
  );
}

function ProtectedAdminAnalyticsPage() {
  return (
    <AdminRoute allowAnalyticsViewer>
      <DesktopAdminAnalytics />
    </AdminRoute>
  );
}

function ProtectedMobileAdminAnalyticsPage() {
  return (
    <AdminRoute allowAnalyticsViewer>
      <MobileAdminAnalytics />
    </AdminRoute>
  );
}

function ProtectedSignaturePage() {
  return (
    <ProtectedRoute>
      <ElectronicSignaturePage />
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: ModernHomePage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/free-legal-documents",
    Component: FreeLegalDocumentsLanding,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/electronic-signature",
    Component: ElectronicSignatureLanding,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/online-lease-agreement",
    Component: OnlineLeaseAgreementLanding,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/nda-generator",
    Component: NdaGeneratorLanding,
    errorElement: <RouteErrorBoundary />,
  },
  // LatAm e-signature expansion — same product/pricing, country-specific
  // legal-compliance copy (see CountrySignatureLanding.tsx).
  {
    path: "/firma-electronica-colombia",
    Component: FirmaElectronicaColombia,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firma-electronica-mexico",
    Component: FirmaElectronicaMexico,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firma-electronica-chile",
    Component: FirmaElectronicaChile,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firma-electronica-peru",
    Component: FirmaElectronicaPeru,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firma-electronica-argentina",
    Component: FirmaElectronicaArgentina,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firma-electronica-ecuador",
    Component: FirmaElectronicaEcuador,
    errorElement: <RouteErrorBoundary />,
  },
  // Fase 3 -- SEO "gratis" (7 paginas, cada una con un angulo distinto,
  // ver free-feature-seo-content.ts).
  {
    path: "/firma-electronica-gratis",
    Component: FirmaElectronicaGratis,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firmar-pdf-gratis",
    Component: FirmarPdfGratis,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firma-digital-gratis",
    Component: FirmaDigitalGratis,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firmar-documentos-online-gratis",
    Component: FirmarDocumentosOnlineGratis,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/documentos-legales-gratis",
    Component: DocumentosLegalesGratis,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/crear-documentos-online-gratis",
    Component: CrearDocumentosOnlineGratis,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/certificar-documentos-online",
    Component: CertificarDocumentosOnline,
    errorElement: <RouteErrorBoundary />,
  },
  // Fase 4 -- SEO por profesion (8 paginas, ver profession-seo-content.ts).
  {
    path: "/firma-electronica-para-abogados",
    Component: FirmaElectronicaParaAbogados,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firma-electronica-para-inmobiliarias",
    Component: FirmaElectronicaParaInmobiliarias,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firma-electronica-para-empresas",
    Component: FirmaElectronicaParaEmpresas,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firma-electronica-para-recursos-humanos",
    Component: FirmaElectronicaParaRecursosHumanos,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firma-electronica-para-freelancers",
    Component: FirmaElectronicaParaFreelancers,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firma-electronica-para-constructores",
    Component: FirmaElectronicaParaConstructores,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firma-electronica-para-contadores",
    Component: FirmaElectronicaParaContadores,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firma-electronica-para-consultores",
    Component: FirmaElectronicaParaConsultores,
    errorElement: <RouteErrorBoundary />,
  },
  // Fase 6 -- San Jose, California (ciudad)
  { path: "/san-jose-california", Component: SanJoseCalifornia, errorElement: <RouteErrorBoundary /> },
  { path: "/nda-san-jose-california", Component: NdaSanJoseCalifornia, errorElement: <RouteErrorBoundary /> },
  { path: "/lease-agreement-san-jose-california", Component: LeaseAgreementSanJoseCalifornia, errorElement: <RouteErrorBoundary /> },
  { path: "/independent-contractor-san-jose-california", Component: IndependentContractorSanJoseCalifornia, errorElement: <RouteErrorBoundary /> },
  { path: "/service-agreement-san-jose-california", Component: ServiceAgreementSanJoseCalifornia, errorElement: <RouteErrorBoundary /> },
  { path: "/promissory-note-san-jose-california", Component: PromissoryNoteSanJoseCalifornia, errorElement: <RouteErrorBoundary /> },
  { path: "/vehicle-bill-of-sale-san-jose-california", Component: VehicleBillOfSaleSanJoseCalifornia, errorElement: <RouteErrorBoundary /> },
  // Blog / content marketing -- 20 articulos + indice
  { path: "/blog", Component: BlogIndex, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/why-digital-signatures-matter-2026", Component: BlogWhyDigitalSignaturesMatter2026, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/electronic-signature-vs-digital-signature", Component: BlogElectronicSignatureVsDigitalSignature, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/what-is-an-nda", Component: BlogWhatIsAnNda, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/e-signatures-for-real-estate", Component: BlogESignaturesForRealEstate, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/e-signatures-for-banks-financial-institutions", Component: BlogESignaturesForBanksFinancialInstitutions, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/esign-act-legal-validity-us", Component: BlogEsignActLegalValidityUs, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/free-e-signature-software-small-business", Component: BlogFreeESignatureSoftwareSmallBusiness, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/hidden-cost-of-paper-contracts", Component: BlogHiddenCostOfPaperContracts, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/how-to-send-document-for-signature-online", Component: BlogHowToSendDocumentForSignatureOnline, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/digital-signatures-for-hr-onboarding", Component: BlogDigitalSignaturesForHrOnboarding, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/firma-digital-empresas-2026", Component: BlogFirmaDigitalEmpresas2026, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/firma-electronica-vs-firma-digital", Component: BlogFirmaElectronicaVsFirmaDigital, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/que-es-un-nda-acuerdo-confidencialidad", Component: BlogQueEsUnNdaAcuerdoConfidencialidad, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/firma-electronica-para-inmobiliarias", Component: BlogFirmaElectronicaParaInmobiliarias, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/firma-electronica-para-bancos", Component: BlogFirmaElectronicaParaBancos, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/validez-legal-firma-electronica-latinoamerica", Component: BlogValidezLegalFirmaElectronicaLatinoamerica, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/firma-electronica-gratis-para-pymes", Component: BlogFirmaElectronicaGratisParaPymes, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/costo-oculto-del-papel-en-empresas", Component: BlogCostoOcultoDelPapelEnEmpresas, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/como-enviar-documento-para-firma-online", Component: BlogComoEnviarDocumentoParaFirmaOnline, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/firma-electronica-para-recursos-humanos", Component: BlogFirmaElectronicaParaRecursosHumanos, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/reducir-tiempo-firma-contratos", Component: BlogReducirTiempoFirmaContratos, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/como-evitar-perder-ventas-por-demoras-en-firma", Component: BlogComoEvitarPerderVentasPorDemorasEnFirma, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/nda-unilateral-vs-bilateral", Component: BlogNdaUnilateralVsBilateral, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/errores-comunes-al-redactar-un-nda", Component: BlogErroresComunesAlRedactarUnNda, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/que-pasa-si-rompen-un-nda", Component: BlogQuePasaSiRompenUnNda, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/como-automatizar-contratos-en-una-inmobiliaria-pequena", Component: BlogComoAutomatizarContratosEnUnaInmobiliariaPequena, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/como-protegerse-como-contratista-independiente", Component: BlogComoProtegerseComoContratistaIndependiente, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/ahorrar-horas-eliminando-papel-en-tu-empresa", Component: BlogAhorrarHorasEliminandoPapelEnTuEmpresa, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/como-organizar-documentos-legales-de-tu-empresa", Component: BlogComoOrganizarDocumentosLegalesDeTuEmpresa, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/errores-comunes-en-contrato-de-arrendamiento", Component: BlogErroresComunesEnContratoDeArrendamiento, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/como-verificar-identidad-de-un-firmante", Component: BlogComoVerificarIdentidadDeUnFirmante, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/stop-losing-sales-because-of-slow-contracts", Component: BlogStopLosingSalesBecauseOfSlowContracts, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/what-happens-if-someone-breaks-an-nda", Component: BlogWhatHappensIfSomeoneBreaksAnNda, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/independent-contractor-vs-employee-paperwork", Component: BlogIndependentContractorVsEmployeePaperwork, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/how-freelancers-can-protect-themselves-with-a-contract", Component: BlogHowFreelancersCanProtectThemselvesWithAContract, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/real-cost-of-no-written-contract", Component: BlogRealCostOfNoWrittenContract, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/simple-document-workflow-small-company", Component: BlogSimpleDocumentWorkflowSmallCompany, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/how-to-screen-tenants-and-draft-leases", Component: BlogHowToScreenTenantsAndDraftLeases, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/what-to-know-before-signing-commercial-lease", Component: BlogWhatToKnowBeforeSigningCommercialLease, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/how-to-write-a-service-agreement-that-protects-you", Component: BlogHowToWriteAServiceAgreementThatProtectsYou, errorElement: <RouteErrorBoundary /> },
  { path: "/blog/how-to-vet-a-client-before-signing-a-contract", Component: BlogHowToVetAClientBeforeSigningAContract, errorElement: <RouteErrorBoundary /> },
  // Smart Quotes -- SEO
  { path: "/quote-generator", Component: QuoteGeneratorLanding, errorElement: <RouteErrorBoundary /> },
  { path: "/proposal-generator", Component: ProposalGeneratorLanding, errorElement: <RouteErrorBoundary /> },
  { path: "/business-estimate-generator", Component: BusinessEstimateGeneratorLanding, errorElement: <RouteErrorBoundary /> },
  { path: "/professional-quote-template", Component: ProfessionalQuoteTemplateLanding, errorElement: <RouteErrorBoundary /> },
  { path: "/commercial-proposal-generator", Component: CommercialProposalGeneratorLanding, errorElement: <RouteErrorBoundary /> },
  { path: "/cotizador-online", Component: CotizadorOnlineLanding, errorElement: <RouteErrorBoundary /> },
  { path: "/crear-cotizacion", Component: CrearCotizacionLanding, errorElement: <RouteErrorBoundary /> },
  { path: "/propuesta-comercial", Component: PropuestaComercialLanding, errorElement: <RouteErrorBoundary /> },
  { path: "/generador-de-cotizaciones", Component: GeneradorDeCotizacionesLanding, errorElement: <RouteErrorBoundary /> },
  { path: "/cotizacion-profesional", Component: CotizacionProfesionalLanding, errorElement: <RouteErrorBoundary /> },
  {
    path: "/independent-contractor-agreement",
    Component: IndependentContractorLanding,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/vehicle-bill-of-sale",
    Component: VehicleBillOfSaleLanding,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/promissory-note",
    Component: PromissoryNoteLanding,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/landing/:documentType/:stateSlug",
    Component: StateDocumentLanding,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/legal-documents-california",
    Component: CaliforniaLegalDocuments,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/legal-documents-texas",
    Component: TexasLegalDocuments,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/legal-documents-florida",
    Component: FloridaLegalDocuments,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/legal-documents-new-york",
    Component: NewYorkLegalDocuments,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/legal-documents-illinois",
    Component: IllinoisLegalDocuments,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/legal-documents-pennsylvania",
    Component: PennsylvaniaLegalDocuments,
    errorElement: <RouteErrorBoundary />,
  },
  { path: "/legal-documents-ohio", Component: OhioLegalDocuments, errorElement: <RouteErrorBoundary /> },
  { path: "/legal-documents-georgia", Component: GeorgiaLegalDocuments, errorElement: <RouteErrorBoundary /> },
  { path: "/legal-documents-north-carolina", Component: NorthCarolinaLegalDocuments, errorElement: <RouteErrorBoundary /> },
  { path: "/legal-documents-michigan", Component: MichiganLegalDocuments, errorElement: <RouteErrorBoundary /> },
  { path: "/legal-documents-new-jersey", Component: NewJerseyLegalDocuments, errorElement: <RouteErrorBoundary /> },
  { path: "/legal-documents-virginia", Component: VirginiaLegalDocuments, errorElement: <RouteErrorBoundary /> },
  { path: "/nda-california", Component: NdaCalifornia, errorElement: <RouteErrorBoundary /> },
  { path: "/nda-texas", Component: NdaTexas, errorElement: <RouteErrorBoundary /> },
  { path: "/nda-florida", Component: NdaFlorida, errorElement: <RouteErrorBoundary /> },
  { path: "/nda-new-york", Component: NdaNewYork, errorElement: <RouteErrorBoundary /> },
  { path: "/nda-illinois", Component: NdaIllinois, errorElement: <RouteErrorBoundary /> },
  { path: "/nda-pennsylvania", Component: NdaPennsylvania, errorElement: <RouteErrorBoundary /> },
  { path: "/lease-agreement-california", Component: LeaseAgreementCalifornia, errorElement: <RouteErrorBoundary /> },
  { path: "/lease-agreement-texas", Component: LeaseAgreementTexas, errorElement: <RouteErrorBoundary /> },
  { path: "/lease-agreement-florida", Component: LeaseAgreementFlorida, errorElement: <RouteErrorBoundary /> },
  { path: "/lease-agreement-new-york", Component: LeaseAgreementNewYork, errorElement: <RouteErrorBoundary /> },
  { path: "/lease-agreement-illinois", Component: LeaseAgreementIllinois, errorElement: <RouteErrorBoundary /> },
  { path: "/lease-agreement-pennsylvania", Component: LeaseAgreementPennsylvania, errorElement: <RouteErrorBoundary /> },
  { path: "/independent-contractor-california", Component: IndependentContractorCalifornia, errorElement: <RouteErrorBoundary /> },
  { path: "/independent-contractor-texas", Component: IndependentContractorTexas, errorElement: <RouteErrorBoundary /> },
  { path: "/independent-contractor-florida", Component: IndependentContractorFlorida, errorElement: <RouteErrorBoundary /> },
  { path: "/independent-contractor-new-york", Component: IndependentContractorNewYork, errorElement: <RouteErrorBoundary /> },
  { path: "/independent-contractor-illinois", Component: IndependentContractorIllinois, errorElement: <RouteErrorBoundary /> },
  { path: "/independent-contractor-pennsylvania", Component: IndependentContractorPennsylvania, errorElement: <RouteErrorBoundary /> },
  { path: "/service-agreement-california", Component: ServiceAgreementCalifornia, errorElement: <RouteErrorBoundary /> },
  { path: "/service-agreement-texas", Component: ServiceAgreementTexas, errorElement: <RouteErrorBoundary /> },
  { path: "/service-agreement-florida", Component: ServiceAgreementFlorida, errorElement: <RouteErrorBoundary /> },
  { path: "/service-agreement-new-york", Component: ServiceAgreementNewYork, errorElement: <RouteErrorBoundary /> },
  { path: "/service-agreement-illinois", Component: ServiceAgreementIllinois, errorElement: <RouteErrorBoundary /> },
  { path: "/service-agreement-pennsylvania", Component: ServiceAgreementPennsylvania, errorElement: <RouteErrorBoundary /> },
  { path: "/promissory-note-california", Component: PromissoryNoteCalifornia, errorElement: <RouteErrorBoundary /> },
  { path: "/promissory-note-texas", Component: PromissoryNoteTexas, errorElement: <RouteErrorBoundary /> },
  { path: "/promissory-note-florida", Component: PromissoryNoteFlorida, errorElement: <RouteErrorBoundary /> },
  { path: "/promissory-note-new-york", Component: PromissoryNoteNewYork, errorElement: <RouteErrorBoundary /> },
  { path: "/promissory-note-illinois", Component: PromissoryNoteIllinois, errorElement: <RouteErrorBoundary /> },
  { path: "/promissory-note-pennsylvania", Component: PromissoryNotePennsylvania, errorElement: <RouteErrorBoundary /> },
  { path: "/vehicle-bill-of-sale-california", Component: VehicleBillOfSaleCalifornia, errorElement: <RouteErrorBoundary /> },
  { path: "/vehicle-bill-of-sale-texas", Component: VehicleBillOfSaleTexas, errorElement: <RouteErrorBoundary /> },
  { path: "/vehicle-bill-of-sale-florida", Component: VehicleBillOfSaleFlorida, errorElement: <RouteErrorBoundary /> },
  { path: "/vehicle-bill-of-sale-new-york", Component: VehicleBillOfSaleNewYork, errorElement: <RouteErrorBoundary /> },
  { path: "/vehicle-bill-of-sale-illinois", Component: VehicleBillOfSaleIllinois, errorElement: <RouteErrorBoundary /> },
  { path: "/vehicle-bill-of-sale-pennsylvania", Component: VehicleBillOfSalePennsylvania, errorElement: <RouteErrorBoundary /> },
  { path: "/nda-ohio", Component: NdaOhio, errorElement: <RouteErrorBoundary /> },
  { path: "/nda-georgia", Component: NdaGeorgia, errorElement: <RouteErrorBoundary /> },
  { path: "/nda-north-carolina", Component: NdaNorthCarolina, errorElement: <RouteErrorBoundary /> },
  { path: "/nda-michigan", Component: NdaMichigan, errorElement: <RouteErrorBoundary /> },
  { path: "/nda-new-jersey", Component: NdaNewJersey, errorElement: <RouteErrorBoundary /> },
  { path: "/nda-virginia", Component: NdaVirginia, errorElement: <RouteErrorBoundary /> },
  { path: "/lease-agreement-ohio", Component: LeaseAgreementOhio, errorElement: <RouteErrorBoundary /> },
  { path: "/lease-agreement-georgia", Component: LeaseAgreementGeorgia, errorElement: <RouteErrorBoundary /> },
  { path: "/lease-agreement-north-carolina", Component: LeaseAgreementNorthCarolina, errorElement: <RouteErrorBoundary /> },
  { path: "/lease-agreement-michigan", Component: LeaseAgreementMichigan, errorElement: <RouteErrorBoundary /> },
  { path: "/lease-agreement-new-jersey", Component: LeaseAgreementNewJersey, errorElement: <RouteErrorBoundary /> },
  { path: "/lease-agreement-virginia", Component: LeaseAgreementVirginia, errorElement: <RouteErrorBoundary /> },
  { path: "/independent-contractor-ohio", Component: IndependentContractorOhio, errorElement: <RouteErrorBoundary /> },
  { path: "/independent-contractor-georgia", Component: IndependentContractorGeorgia, errorElement: <RouteErrorBoundary /> },
  { path: "/independent-contractor-north-carolina", Component: IndependentContractorNorthCarolina, errorElement: <RouteErrorBoundary /> },
  { path: "/independent-contractor-michigan", Component: IndependentContractorMichigan, errorElement: <RouteErrorBoundary /> },
  { path: "/independent-contractor-new-jersey", Component: IndependentContractorNewJersey, errorElement: <RouteErrorBoundary /> },
  { path: "/independent-contractor-virginia", Component: IndependentContractorVirginia, errorElement: <RouteErrorBoundary /> },
  { path: "/service-agreement-ohio", Component: ServiceAgreementOhio, errorElement: <RouteErrorBoundary /> },
  { path: "/service-agreement-georgia", Component: ServiceAgreementGeorgia, errorElement: <RouteErrorBoundary /> },
  { path: "/service-agreement-north-carolina", Component: ServiceAgreementNorthCarolina, errorElement: <RouteErrorBoundary /> },
  { path: "/service-agreement-michigan", Component: ServiceAgreementMichigan, errorElement: <RouteErrorBoundary /> },
  { path: "/service-agreement-new-jersey", Component: ServiceAgreementNewJersey, errorElement: <RouteErrorBoundary /> },
  { path: "/service-agreement-virginia", Component: ServiceAgreementVirginia, errorElement: <RouteErrorBoundary /> },
  { path: "/promissory-note-ohio", Component: PromissoryNoteOhio, errorElement: <RouteErrorBoundary /> },
  { path: "/promissory-note-georgia", Component: PromissoryNoteGeorgia, errorElement: <RouteErrorBoundary /> },
  { path: "/promissory-note-north-carolina", Component: PromissoryNoteNorthCarolina, errorElement: <RouteErrorBoundary /> },
  { path: "/promissory-note-michigan", Component: PromissoryNoteMichigan, errorElement: <RouteErrorBoundary /> },
  { path: "/promissory-note-new-jersey", Component: PromissoryNoteNewJersey, errorElement: <RouteErrorBoundary /> },
  { path: "/promissory-note-virginia", Component: PromissoryNoteVirginia, errorElement: <RouteErrorBoundary /> },
  { path: "/vehicle-bill-of-sale-ohio", Component: VehicleBillOfSaleOhio, errorElement: <RouteErrorBoundary /> },
  { path: "/vehicle-bill-of-sale-georgia", Component: VehicleBillOfSaleGeorgia, errorElement: <RouteErrorBoundary /> },
  { path: "/vehicle-bill-of-sale-north-carolina", Component: VehicleBillOfSaleNorthCarolina, errorElement: <RouteErrorBoundary /> },
  { path: "/vehicle-bill-of-sale-michigan", Component: VehicleBillOfSaleMichigan, errorElement: <RouteErrorBoundary /> },
  { path: "/vehicle-bill-of-sale-new-jersey", Component: VehicleBillOfSaleNewJersey, errorElement: <RouteErrorBoundary /> },
  { path: "/vehicle-bill-of-sale-virginia", Component: VehicleBillOfSaleVirginia, errorElement: <RouteErrorBoundary /> },
  {
    // Generator is open to all — auth/payment is gated at preview/download
    path: "/generator/:documentType",
    Component: DocumentGeneratorPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/preview/:documentType",
    Component: PreviewPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/checkout",
    Component: CheckoutPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/firma-electronica",
    Component: ProtectedSignaturePage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/signatures",
    Component: ProtectedSignaturePage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/my-documents",
    Component: ProtectedMyDocumentsPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    // Custom templates — separate from the built-in template gallery at
    // /dashboard/templates and /app/templates: the client's own uploaded
    // documents with click-placed fillable fields, not our pre-made ones.
    path: "/my-templates",
    Component: ProtectedMyTemplatesPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/my-templates/new",
    Component: ProtectedMyTemplateEditorPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/my-templates/:id/fill",
    Component: ProtectedMyTemplateFillPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/my-branding",
    Component: ProtectedMyBrandingPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/my-company",
    Component: ProtectedMyCompanyPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/my-contacts",
    Component: ProtectedMyContactsPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/my-quotes",
    Component: ProtectedMyQuotesPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/my-quotes/new",
    Component: ProtectedMyQuoteEditorPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/my-quotes/:id",
    Component: ProtectedMyQuoteEditorPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    // Private desktop app (Mundo 2) — DesktopAppShell itself redirects to
    // "/app" on a mobile viewport and to "/" if there's no session, so
    // these paths never render anything for an anonymous or mobile visitor.
    // The public landing at "/" is untouched (Mundo 1) — see
    // modern-home-page.tsx's isDesktopAuthed redirect for the other half
    // of this separation.
    path: "/dashboard",
    Component: DesktopDashboardHome,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/dashboard/documents",
    Component: DesktopDocuments,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/dashboard/signatures",
    Component: DesktopSignatures,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/dashboard/templates",
    Component: DesktopTemplates,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/dashboard/profile",
    Component: DesktopProfile,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/dashboard/settings",
    Component: DesktopSettings,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/dashboard/notifications",
    Component: DesktopNotifications,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/dashboard/ai",
    Component: DesktopAI,
    errorElement: <RouteErrorBoundary />,
  },
  {
    // Admin-only — AdminRoute bounces non-admins back to /dashboard.
    path: "/dashboard/admin/analytics",
    Component: ProtectedAdminAnalyticsPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    // Mobile-only app shell (bottom-nav dashboard) — MobileAppShell itself
    // redirects to "/" if not on a real mobile viewport or not signed in,
    // so these paths never render anything different from the desktop
    // site when hit from a desktop browser.
    path: "/app",
    Component: MobileDashboardHome,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/app/templates",
    Component: MobileTemplates,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/app/signatures",
    Component: MobileSignatures,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/app/documents",
    Component: MobileDocuments,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/app/profile",
    Component: MobileProfile,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/app/profile/notifications",
    Component: MobileNotifications,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/app/profile/settings",
    Component: MobileSettings,
    errorElement: <RouteErrorBoundary />,
  },
  {
    // Admin-only — AdminRoute bounces non-admins back to /app.
    path: "/app/admin/analytics",
    Component: ProtectedMobileAdminAnalyticsPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/preview/success",
    Component: PaymentSuccessPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    // Legacy PDF-based guest signing (QR invitations from co-signer flow)
    path: "/guest-sign/:token",
    Component: GuestSignPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    // New transaction-based signing page (share link from IntentModal flow)
    path: "/sign/:transactionId",
    Component: SignTransactionPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    // Lightweight mobile signing page — opened via QR from SignaturePad
    path: "/quick-sign/:token",
    Component: QuickSignPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/terms",
    Component: TermsOfServicePage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/privacy",
    Component: PrivacyPolicyPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/refund-policy",
    Component: RefundPolicyPage,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "*",
    Component: NotFoundPage,
    errorElement: <RouteErrorBoundary />,
  },
]);
