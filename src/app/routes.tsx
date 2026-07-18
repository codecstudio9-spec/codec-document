import { createBrowserRouter } from "react-router";
import { ModernHomePage } from "./pages/modern-home-page";
import { DocumentGeneratorPage } from "./pages/document-generator-page";
import { PreviewPage } from "./pages/preview-page";
import { CheckoutPage } from "./pages/checkout-page";
import { NotFoundPage } from "./pages/not-found-page";
import { TermsOfServicePage } from "./pages/terms-of-service";
import { PrivacyPolicyPage } from "./pages/privacy-policy";
import { RefundPolicyPage } from "./pages/refund-policy";
import { PaymentSuccessPage } from "./pages/payment-success-page";
import { GuestSignPage } from "./pages/guest-sign-page";
import { QuickSignPage } from "./pages/quick-sign-page";
import SignTransactionPage from "./pages/sign-transaction-page";
import { MyDocumentsPage } from "./pages/my-documents-page";
import { MyTemplatesPage } from "./pages/my-templates-page";
import { MyTemplateEditorPage } from "./pages/my-template-editor-page";
import { MyTemplateFillPage } from "./pages/my-template-fill-page";
import { MyBrandingPage } from "./pages/my-branding-page";
import { MyCompanyPage } from "./pages/my-company-page";
import { ElectronicSignaturePage } from "./pages/electronic-signature-page";
import FreeLegalDocumentsLanding from "./pages/landings/free-legal-documents";
import ElectronicSignatureLanding from "./pages/landings/electronic-signature";
import OnlineLeaseAgreementLanding from "./pages/landings/online-lease-agreement";
import NdaGeneratorLanding from "./pages/landings/nda-generator";
import IndependentContractorLanding from "./pages/landings/independent-contractor-agreement";
import VehicleBillOfSaleLanding from "./pages/landings/billing-vehicle-bill-of-sale";
import PromissoryNoteLanding from "./pages/landings/promissory-note";
import StateDocumentLanding from './pages/landings/state-document';
import CaliforniaLegalDocuments from './pages/landings/california-legal-documents';
import TexasLegalDocuments from './pages/landings/texas-legal-documents';
import FloridaLegalDocuments from './pages/landings/florida-legal-documents';
import NewYorkLegalDocuments from './pages/landings/new-york-legal-documents';
import IllinoisLegalDocuments from './pages/landings/illinois-legal-documents';
import PennsylvaniaLegalDocuments from './pages/landings/pennsylvania-legal-documents';
import OhioLegalDocuments from './pages/landings/ohio-legal-documents';
import GeorgiaLegalDocuments from './pages/landings/georgia-legal-documents';
import NorthCarolinaLegalDocuments from './pages/landings/north-carolina-legal-documents';
import MichiganLegalDocuments from './pages/landings/michigan-legal-documents';
import NewJerseyLegalDocuments from './pages/landings/new-jersey-legal-documents';
import VirginiaLegalDocuments from './pages/landings/virginia-legal-documents';
import NdaCalifornia from './pages/landings/nda-california';
import NdaTexas from './pages/landings/nda-texas';
import NdaFlorida from './pages/landings/nda-florida';
import NdaNewYork from './pages/landings/nda-new-york';
import NdaIllinois from './pages/landings/nda-illinois';
import NdaPennsylvania from './pages/landings/nda-pennsylvania';
import LeaseAgreementCalifornia from './pages/landings/lease-agreement-california';
import LeaseAgreementTexas from './pages/landings/lease-agreement-texas';
import LeaseAgreementFlorida from './pages/landings/lease-agreement-florida';
import LeaseAgreementNewYork from './pages/landings/lease-agreement-new-york';
import LeaseAgreementIllinois from './pages/landings/lease-agreement-illinois';
import LeaseAgreementPennsylvania from './pages/landings/lease-agreement-pennsylvania';
import IndependentContractorCalifornia from './pages/landings/independent-contractor-california';
import IndependentContractorTexas from './pages/landings/independent-contractor-texas';
import IndependentContractorFlorida from './pages/landings/independent-contractor-florida';
import IndependentContractorNewYork from './pages/landings/independent-contractor-new-york';
import IndependentContractorIllinois from './pages/landings/independent-contractor-illinois';
import IndependentContractorPennsylvania from './pages/landings/independent-contractor-pennsylvania';
import ServiceAgreementCalifornia from './pages/landings/service-agreement-california';
import ServiceAgreementTexas from './pages/landings/service-agreement-texas';
import ServiceAgreementFlorida from './pages/landings/service-agreement-florida';
import ServiceAgreementNewYork from './pages/landings/service-agreement-new-york';
import ServiceAgreementIllinois from './pages/landings/service-agreement-illinois';
import ServiceAgreementPennsylvania from './pages/landings/service-agreement-pennsylvania';
import PromissoryNoteCalifornia from './pages/landings/promissory-note-california';
import PromissoryNoteTexas from './pages/landings/promissory-note-texas';
import PromissoryNoteFlorida from './pages/landings/promissory-note-florida';
import PromissoryNoteNewYork from './pages/landings/promissory-note-new-york';
import PromissoryNoteIllinois from './pages/landings/promissory-note-illinois';
import PromissoryNotePennsylvania from './pages/landings/promissory-note-pennsylvania';
import VehicleBillOfSaleCalifornia from './pages/landings/vehicle-bill-of-sale-california';
import VehicleBillOfSaleTexas from './pages/landings/vehicle-bill-of-sale-texas';
import VehicleBillOfSaleFlorida from './pages/landings/vehicle-bill-of-sale-florida';
import VehicleBillOfSaleNewYork from './pages/landings/vehicle-bill-of-sale-new-york';
import VehicleBillOfSaleIllinois from './pages/landings/vehicle-bill-of-sale-illinois';
import VehicleBillOfSalePennsylvania from './pages/landings/vehicle-bill-of-sale-pennsylvania';
import NdaOhio from './pages/landings/nda-ohio';
import NdaGeorgia from './pages/landings/nda-georgia';
import NdaNorthCarolina from './pages/landings/nda-north-carolina';
import NdaMichigan from './pages/landings/nda-michigan';
import NdaNewJersey from './pages/landings/nda-new-jersey';
import NdaVirginia from './pages/landings/nda-virginia';
import LeaseAgreementOhio from './pages/landings/lease-agreement-ohio';
import LeaseAgreementGeorgia from './pages/landings/lease-agreement-georgia';
import LeaseAgreementNorthCarolina from './pages/landings/lease-agreement-north-carolina';
import LeaseAgreementMichigan from './pages/landings/lease-agreement-michigan';
import LeaseAgreementNewJersey from './pages/landings/lease-agreement-new-jersey';
import LeaseAgreementVirginia from './pages/landings/lease-agreement-virginia';
import IndependentContractorOhio from './pages/landings/independent-contractor-ohio';
import IndependentContractorGeorgia from './pages/landings/independent-contractor-georgia';
import IndependentContractorNorthCarolina from './pages/landings/independent-contractor-north-carolina';
import IndependentContractorMichigan from './pages/landings/independent-contractor-michigan';
import IndependentContractorNewJersey from './pages/landings/independent-contractor-new-jersey';
import IndependentContractorVirginia from './pages/landings/independent-contractor-virginia';
import ServiceAgreementOhio from './pages/landings/service-agreement-ohio';
import ServiceAgreementGeorgia from './pages/landings/service-agreement-georgia';
import ServiceAgreementNorthCarolina from './pages/landings/service-agreement-north-carolina';
import ServiceAgreementMichigan from './pages/landings/service-agreement-michigan';
import ServiceAgreementNewJersey from './pages/landings/service-agreement-new-jersey';
import ServiceAgreementVirginia from './pages/landings/service-agreement-virginia';
import PromissoryNoteOhio from './pages/landings/promissory-note-ohio';
import PromissoryNoteGeorgia from './pages/landings/promissory-note-georgia';
import PromissoryNoteNorthCarolina from './pages/landings/promissory-note-north-carolina';
import PromissoryNoteMichigan from './pages/landings/promissory-note-michigan';
import PromissoryNoteNewJersey from './pages/landings/promissory-note-new-jersey';
import PromissoryNoteVirginia from './pages/landings/promissory-note-virginia';
import VehicleBillOfSaleOhio from './pages/landings/vehicle-bill-of-sale-ohio';
import VehicleBillOfSaleGeorgia from './pages/landings/vehicle-bill-of-sale-georgia';
import VehicleBillOfSaleNorthCarolina from './pages/landings/vehicle-bill-of-sale-north-carolina';
import VehicleBillOfSaleMichigan from './pages/landings/vehicle-bill-of-sale-michigan';
import VehicleBillOfSaleNewJersey from './pages/landings/vehicle-bill-of-sale-new-jersey';
import VehicleBillOfSaleVirginia from './pages/landings/vehicle-bill-of-sale-virginia';
import FirmaElectronicaColombia from './pages/landings/firma-electronica-colombia';
import FirmaElectronicaMexico from './pages/landings/firma-electronica-mexico';
import FirmaElectronicaChile from './pages/landings/firma-electronica-chile';
import FirmaElectronicaPeru from './pages/landings/firma-electronica-peru';
import FirmaElectronicaArgentina from './pages/landings/firma-electronica-argentina';
import FirmaElectronicaEcuador from './pages/landings/firma-electronica-ecuador';
import FirmaElectronicaGratis from './pages/landings/firma-electronica-gratis';
import FirmarPdfGratis from './pages/landings/firmar-pdf-gratis';
import FirmaDigitalGratis from './pages/landings/firma-digital-gratis';
import FirmarDocumentosOnlineGratis from './pages/landings/firmar-documentos-online-gratis';
import DocumentosLegalesGratis from './pages/landings/documentos-legales-gratis';
import CrearDocumentosOnlineGratis from './pages/landings/crear-documentos-online-gratis';
import CertificarDocumentosOnline from './pages/landings/certificar-documentos-online';
import FirmaElectronicaParaAbogados from './pages/landings/firma-electronica-para-abogados';
import FirmaElectronicaParaInmobiliarias from './pages/landings/firma-electronica-para-inmobiliarias';
import FirmaElectronicaParaEmpresas from './pages/landings/firma-electronica-para-empresas';
import FirmaElectronicaParaRecursosHumanos from './pages/landings/firma-electronica-para-recursos-humanos';
import FirmaElectronicaParaFreelancers from './pages/landings/firma-electronica-para-freelancers';
import FirmaElectronicaParaConstructores from './pages/landings/firma-electronica-para-constructores';
import FirmaElectronicaParaContadores from './pages/landings/firma-electronica-para-contadores';
import FirmaElectronicaParaConsultores from './pages/landings/firma-electronica-para-consultores';
import { ProtectedRoute } from "./components/auth/protected-route";
import { AdminRoute } from "./components/auth/AdminRoute";
import { MobileDashboardHome } from "./pages/mobile/MobileDashboardHome";
import { MobileTemplates } from "./pages/mobile/MobileTemplates";
import { MobileSignatures } from "./pages/mobile/MobileSignatures";
import { MobileDocuments } from "./pages/mobile/MobileDocuments";
import { MobileProfile } from "./pages/mobile/MobileProfile";
import { MobileNotifications } from "./pages/mobile/MobileNotifications";
import { MobileSettings } from "./pages/mobile/MobileSettings";
import { MobileAdminAnalytics } from "./pages/mobile/MobileAdminAnalytics";
import { DesktopDashboardHome } from "./pages/desktop/DesktopDashboardHome";
import { DesktopDocuments } from "./pages/desktop/DesktopDocuments";
import { DesktopSignatures } from "./pages/desktop/DesktopSignatures";
import { DesktopTemplates } from "./pages/desktop/DesktopTemplates";
import { DesktopProfile } from "./pages/desktop/DesktopProfile";
import { DesktopSettings } from "./pages/desktop/DesktopSettings";
import { DesktopNotifications } from "./pages/desktop/DesktopNotifications";
import { DesktopAI } from "./pages/desktop/DesktopAI";
import { DesktopAdminAnalytics } from "./pages/desktop/DesktopAdminAnalytics";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";

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

function ProtectedAdminAnalyticsPage() {
  return (
    <AdminRoute>
      <DesktopAdminAnalytics />
    </AdminRoute>
  );
}

function ProtectedMobileAdminAnalyticsPage() {
  return (
    <AdminRoute>
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
