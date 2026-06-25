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
import { ProtectedRoute } from "./components/auth/protected-route";

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
