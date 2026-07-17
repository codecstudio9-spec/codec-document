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
import { AdminRoute } from "./components/auth/AdminRoute";
import { MobileDashboardHome } from "./pages/mobile/MobileDashboardHome";
import { MobileTemplates } from "./pages/mobile/MobileTemplates";
import { MobileSignatures } from "./pages/mobile/MobileSignatures";
import { MobileDocuments } from "./pages/mobile/MobileDocuments";
import { MobileProfile } from "./pages/mobile/MobileProfile";
import { MobileNotifications } from "./pages/mobile/MobileNotifications";
import { MobileSettings } from "./pages/mobile/MobileSettings";
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

function ProtectedAdminAnalyticsPage() {
  return (
    <AdminRoute>
      <DesktopAdminAnalytics />
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
