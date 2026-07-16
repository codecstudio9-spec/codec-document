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
import { ElectronicSignaturePage } from "./pages/electronic-signature-page";
import FreeLegalDocumentsLanding from "./pages/landings/free-legal-documents";
import ElectronicSignatureLanding from "./pages/landings/electronic-signature";
import OnlineLeaseAgreementLanding from "./pages/landings/online-lease-agreement";
import NdaGeneratorLanding from "./pages/landings/nda-generator";
import IndependentContractorLanding from "./pages/landings/independent-contractor-agreement";
import VehicleBillOfSaleLanding from "./pages/landings/billing-vehicle-bill-of-sale";
import PromissoryNoteLanding from "./pages/landings/promissory-note";
import StateDocumentLanding from './pages/landings/state-document';
import { ProtectedRoute } from "./components/auth/protected-route";
import { MobileDashboardHome } from "./pages/mobile/MobileDashboardHome";
import { MobileTemplates } from "./pages/mobile/MobileTemplates";
import { MobileSignatures } from "./pages/mobile/MobileSignatures";
import { MobileDocuments } from "./pages/mobile/MobileDocuments";
import { MobileProfile } from "./pages/mobile/MobileProfile";

function ProtectedMyDocumentsPage() {
  return (
    <ProtectedRoute>
      <MyDocumentsPage />
    </ProtectedRoute>
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
  },
  {
    path: "/free-legal-documents",
    Component: FreeLegalDocumentsLanding,
  },
  {
    path: "/electronic-signature",
    Component: ElectronicSignatureLanding,
  },
  {
    path: "/online-lease-agreement",
    Component: OnlineLeaseAgreementLanding,
  },
  {
    path: "/nda-generator",
    Component: NdaGeneratorLanding,
  },
  {
    path: "/independent-contractor-agreement",
    Component: IndependentContractorLanding,
  },
  {
    path: "/vehicle-bill-of-sale",
    Component: VehicleBillOfSaleLanding,
  },
  {
    path: "/promissory-note",
    Component: PromissoryNoteLanding,
  },
  {
    path: "/landing/:documentType/:stateSlug",
    Component: StateDocumentLanding,
  },
  {
    // Generator is open to all — auth/payment is gated at preview/download
    path: "/generator/:documentType",
    Component: DocumentGeneratorPage,
  },
  {
    path: "/preview/:documentType",
    Component: PreviewPage,
  },
  {
    path: "/checkout",
    Component: CheckoutPage,
  },
  {
    path: "/firma-electronica",
    Component: ProtectedSignaturePage,
  },
  {
    path: "/signatures",
    Component: ProtectedSignaturePage,
  },
  {
    path: "/my-documents",
    Component: ProtectedMyDocumentsPage,
  },
  {
    path: "/dashboard",
    Component: ProtectedMyDocumentsPage,
  },
  {
    // Mobile-only app shell (bottom-nav dashboard) — MobileAppShell itself
    // redirects to "/" if not on a real mobile viewport or not signed in,
    // so these paths never render anything different from the desktop
    // site when hit from a desktop browser.
    path: "/app",
    Component: MobileDashboardHome,
  },
  {
    path: "/app/templates",
    Component: MobileTemplates,
  },
  {
    path: "/app/signatures",
    Component: MobileSignatures,
  },
  {
    path: "/app/documents",
    Component: MobileDocuments,
  },
  {
    path: "/app/profile",
    Component: MobileProfile,
  },
  {
    path: "/preview/success",
    Component: PaymentSuccessPage,
  },
  {
    // Legacy PDF-based guest signing (QR invitations from co-signer flow)
    path: "/guest-sign/:token",
    Component: GuestSignPage,
  },
  {
    // New transaction-based signing page (share link from IntentModal flow)
    path: "/sign/:transactionId",
    Component: SignTransactionPage,
  },
  {
    // Lightweight mobile signing page — opened via QR from SignaturePad
    path: "/quick-sign/:token",
    Component: QuickSignPage,
  },
  {
    path: "/terms",
    Component: TermsOfServicePage,
  },
  {
    path: "/privacy",
    Component: PrivacyPolicyPage,
  },
  {
    path: "/refund-policy",
    Component: RefundPolicyPage,
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);
