import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Star, QrCode, FileText, BadgeCheck, User, ChevronDown, FolderOpen, PenLine, LogOut, Settings, Camera, Download, Mail, Check, CheckCircle2, ArrowRight, Building2, Receipt, Sparkles, Briefcase, CalendarClock, MessageCircle, Layers, Send, Volume2, ShieldCheck, CreditCard, Smartphone, FileCheck, Fingerprint, Search, X, Home, Users, HardHat, Calculator, Scale, type LucideIcon } from 'lucide-react';
import { EnterpriseLeadModal } from '../components/EnterpriseLeadModal';
import { documentTemplates } from '../data/templates';
import { useLanguage } from '../contexts/language-context';
import { LanguageToggle } from '../components/language-toggle';
import { SEOHead } from '../components/seo-head';
import { StructuredData } from '../components/structured-data';
import { SITE_URL, SUPPORT_EMAIL, INFO_EMAIL, BUSINESS_EMAIL, WHATSAPP_LINK, MEETING_LINK } from '../config/site';
import { ModernHero } from '../components/modern-hero';
import { LatamHero } from '../components/latam-hero';
import { DocumentBentoGrid } from '../components/document-bento-grid';
import { detectSignerCountryCode } from '../../lib/geo';
import { isAdminEmail } from '../utils/admin-access';
import { STATES } from '../data/doctype-state-seo-content';
import { LATAM_COUNTRIES } from '../data/latam-signature-seo-content';
import { useAuth } from '../contexts/auth-context';
import { toast } from 'sonner';
import { createSignatureRequest, getSignaturePricingStatus, getSignatureRequestStatus } from '../services/paypal-service';
import { voiceAssistant } from '../services/voice-assistant-service';
import { QRCodeSVG } from 'qrcode.react';
import * as pdfjsLib from 'pdfjs-dist';
import { OnboardingModal } from '../components/auth/OnboardingModal';
import { useIsMobile } from '../hooks/use-is-mobile';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const waitForNextPaint = async () => {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

const uint8ToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

export function ModernHomePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, token, signInWithGoogleToken, logout } = useAuth();
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);
  const [filteredDocuments] = useState(documentTemplates);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDocumentsMenu, setShowDocumentsMenu] = useState(false);
  const [showPlatformMenu, setShowPlatformMenu] = useState(false);
  // Single reusable "explain this" popup, driven by whichever security
  // feature or compliance/law badge the visitor clicked. One modal instead
  // of one-per-card keeps this simple: image-forward (big icon), 1-2 short
  // sentences, no wall of text.
  const [infoModal, setInfoModal] = useState<{ icon: LucideIcon; color: string; title: string; desc: string } | null>(null);
  const [voiceDemoPlaying, setVoiceDemoPlaying] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState('');
  const [uploadMimeType, setUploadMimeType] = useState('');
  const [uploadPreviewKind, setUploadPreviewKind] = useState<'pdf' | 'image' | 'unsupported' | ''>('');
  const [uploadPdfBytes, setUploadPdfBytes] = useState<Uint8Array | null>(null);
  const [previewRenderFailed, setPreviewRenderFailed] = useState(false);
  const [qrLink, setQrLink] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [qrStatus, setQrStatus] = useState<'IDLE' | 'PENDING' | 'SIGNED'>('IDLE');
  const [remoteSignerEmail, setRemoteSignerEmail] = useState('');
  const [remoteSignerName, setRemoteSignerName] = useState('');
  const [signatureMarker, setSignatureMarker] = useState<{ page: number; x: number; y: number } | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const pdfPagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [dailyPricing, setDailyPricing] = useState<{ freePerDay: number; extraFeeUsd: number; dailyUsage: number; freeRemaining: number; nextRequestFeeUsd: number } | null>(null);
  const googleInitializedRef = useRef(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const pdfRenderJobRef = useRef(0);
  const featuredDocuments = documentTemplates.slice(0, 6);
  const [scrolled, setScrolled] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  // Contextual message shown in the signup popup, set right before opening
  // it from a spot other than the generic "Try free" header button, so the
  // popup explains WHY it appeared (clicked "Sign now" or a free template
  // card while signed out) instead of always showing the default intro.
  const [onboardingContext, setOnboardingContext] = useState<string | undefined>(undefined);
  const requireAuthToSign = () => {
    setOnboardingContext(language === 'en' ? 'To sign, register free first' : 'Para firmar debes registrarte gratis');
    setOnboardingOpen(true);
  };
  const requireAuthToUseTemplate = () => {
    setOnboardingContext(language === 'en' ? 'Register free to create your document' : 'Regístrate gratis para crear tu documento');
    setOnboardingOpen(true);
  };
  // Generic "log in, then land on X" — stash the intended destination before
  // opening the auth modal; consumed by the effect below once `user` goes
  // truthy (works even if that happens in another tab via magic link, since
  // Supabase's auth listener syncs session state across tabs of the same
  // browser, same mechanism AuthModals already relies on to auto-close).
  const goToTemplatesAfterAuth = () => {
    if (user) { navigate('/dashboard/templates'); return; }
    localStorage.setItem('codec_post_auth_redirect', '/dashboard/templates');
    setOnboardingContext(language === 'en' ? 'Register free to see all templates' : 'Regístrate gratis para ver todas las plantillas');
    setOnboardingOpen(true);
  };
  useEffect(() => {
    if (!user) return;
    const target = localStorage.getItem('codec_post_auth_redirect');
    if (target) {
      localStorage.removeItem('codec_post_auth_redirect');
      navigate(target);
    }
  }, [user, navigate]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Geolocation-aware home: a visitor detected outside the US sees the
  // LatAm hero (4 universal actions, same moving-card/background style
  // as ModernHero) and the US document-template grid is hidden entirely
  //, confirmed explicitly with the user (see conversation). US or
  // undetected visitors keep the exact original experience.
  const [visitorIsLatam, setVisitorIsLatam] = useState(false);
  // Real detected country code (e.g. 'CO', 'MX'), kept separate from the
  // market override below so the compliance strip can still show the
  // visitor's actual local law even when ?market=latam is only overriding
  // which hero/section layout renders, not the underlying geo fact.
  const [visitorCountryCode, setVisitorCountryCode] = useState<string | null>(null);
  // Manual override, ?market=us / ?market=latam in the URL, so anyone
  // (not just an account whose real IP happens to geolocate to the other
  // market) can preview either home experience on demand. Wins over the
  // real geo-detection below when present; the footer link that sets this
  // is exactly for that "let me see the other version" use case.
  const marketOverride = new URLSearchParams(window.location.search).get('market');
  useEffect(() => {
    detectSignerCountryCode().then((code) => {
      if (!code) return;
      setVisitorCountryCode(code);
      if (marketOverride === 'us' || marketOverride === 'latam') return;
      if (code !== 'US') setVisitorIsLatam(true);
    }).catch(() => {});
  }, [marketOverride]);
  const effectiveIsLatam = marketOverride === 'us' ? false : marketOverride === 'latam' ? true : visitorIsLatam;
  const matchedLatamCountry = LATAM_COUNTRIES.find((c) => c.code === visitorCountryCode) ?? null;

  // Mobile app-shell: ANY visitor on a real mobile viewport (signed in or
  // not) gets the bottom-nav app shell instead of the long-scroll landing
  // page, this traditional landing below stays desktop-only + a dedicated
  // marketing/SEO surface, per the explicit "no more scroll-based landing
  // on mobile" requirement. MobileAppShell/MobileDashboardHome handle the
  // signed-out state themselves (compact intro instead of real stats).
  const isMobile = useIsMobile();
  useEffect(() => {
    if (isMobile) navigate('/app', { replace: true });
  }, [isMobile, navigate]);

  // Mundo 1 (marketing, public) vs Mundo 2 (product, private): a signed-in
  // desktop visitor should never see this landing either, straight into
  // the real dashboard, same as mobile above. Anonymous desktop visitors
  // are completely unaffected, landing stays exactly as-is for SEO/marketing.
  useEffect(() => {
    if (!isMobile && user) navigate('/dashboard', { replace: true });
  }, [isMobile, user, navigate]);


  const premiumTestimonials = [
    {
      quote: 'Saved me hours every week. I now close lease agreements in minutes instead of dealing with paper.',
      author: 'Sarah M.',
      role: 'Licensed Real Estate Broker · Miami, FL',
      stars: 5,
      avatar: 'https://i.pravatar.cc/120?img=32'
    },
    {
      quote: 'The co-signer QR link is a game changer. My tenants sign remotely with zero friction.',
      author: 'James T.',
      role: 'Property Manager · Austin, TX',
      stars: 5,
      avatar: 'https://i.pravatar.cc/120?img=12'
    },
    {
      quote: 'Professional-grade PDFs with biometric verification. My clients think I have an in-house legal team.',
      author: 'Rachel L.',
      role: 'Independent Contractor · New York, NY',
      stars: 5,
      avatar: 'https://i.pravatar.cc/120?img=47'
    },
    {
      quote: 'NDA and contractor agreements ready in 4 minutes. The SHA-256 audit trail gives me peace of mind.',
      author: 'Mike D.',
      role: 'Landlord & Property Investor · Phoenix, AZ',
      stars: 5,
      avatar: 'https://i.pravatar.cc/120?img=54'
    },
    {
      quote: "Best DocuSign alternative I've found. Full template editor, not just a PDF uploader, and it's free to start.",
      author: 'Jennifer K.',
      role: 'Small Business Owner · Los Angeles, CA',
      stars: 5,
      avatar: 'https://i.pravatar.cc/120?img=5'
    },
    {
      quote: 'ESIGN Act compliant documents for all 50 states. Perfect for my multi-state real estate portfolio.',
      author: 'Robert H.',
      role: 'Real Estate Investor · Dallas, TX',
      stars: 5,
      avatar: 'https://i.pravatar.cc/120?img=60'
    },
    {
      quote: 'The selfie + ID verification embedded in the PDF is brilliant. No more chasing signatures.',
      author: 'Sophia N.',
      role: 'Attorney & Notary · Chicago, IL',
      stars: 4,
      avatar: 'https://i.pravatar.cc/120?img=20'
    },
    {
      quote: 'Sent 12 service agreements this month in half the time. The mobile-to-desktop sync is seamless.',
      author: 'Carlos R.',
      role: 'General Contractor · Houston, TX',
      stars: 5,
      avatar: 'https://i.pravatar.cc/120?img=15'
    },
    {
      quote: 'I went from 45 minutes per lease to under 5. My broker team uses it daily now.',
      author: 'Elena C.',
      role: 'Realtor & Team Lead · Denver, CO',
      stars: 5,
      avatar: 'https://i.pravatar.cc/120?img=40'
    },
    {
      quote: 'The identity verification makes our vendor onboarding bulletproof. Highly recommended.',
      author: 'David B.',
      role: 'Director of Operations · Seattle, WA',
      stars: 5,
      avatar: 'https://i.pravatar.cc/120?img=9'
    }
  ];
  const faqs = language === 'en'
    ? [
        {
          q: 'Is Codec Document free to use?',
          a: 'Yes. Our Free Plan gives you 18 structured intelligent documents and 18 free ESIGN-compliant digital signatures per month, no credit card required. Unlike platforms that only let you sign flat PDFs you upload from elsewhere, Codec Document builds NDA, lease agreements, and service contracts from scratch for free. Premium plans unlock unlimited documents, co-signer QR links, identity verification, and priority support.'
        },
        {
          q: 'How does Codec Document compare to DocuSign or PandaDoc?',
          a: 'Codec Document gives you a free intelligent template editor, not just a flat PDF signer. You build professional legal documents from scratch, customize every field, apply your logo, and e-sign with ESIGN Act compliance. Plus, our native selfie + ID biometric verification creates an embedded audit trail that traditional platforms charge extra for. Premium plans start at $29.99/month.'
        },
        {
          q: 'Are e-signatures legally valid in the USA?',
          a: 'Yes. All signatures on Codec Document are fully compliant with the US Federal ESIGN Act (15 U.S.C. § 7001) and UETA (Uniform Electronic Transactions Act). Every document receives a SHA-256 cryptographic fingerprint, IP logging, timestamp, and an immutable audit trail, making them court-admissible in all 50 states.'
        },
        {
          q: 'Are these documents valid in all 50 U.S. states?',
          a: 'Our templates include state-specific legal clauses for all 50 US states including California, Texas, Florida, New York, Illinois, and more. The documents automatically adapt compliance notices based on the selected state. For complex transactions or litigation-critical agreements, we recommend reviewing with a licensed attorney.'
        },
        {
          q: 'What is identity verification and how does it work?',
          a: 'After signing, you can optionally capture a live selfie and a photo of your government ID directly through the browser. These images are embedded as a biometric audit block directly inside the signed PDF, no external app required. This adds an additional layer of identity assurance beyond the digital signature itself.'
        },
        {
          q: 'Can I preview the full document before paying?',
          a: 'Yes. Fill out the complete form and preview the entire document with watermark before any payment. Free users download 1 clean watermark-free copy per 72h; premium users get unlimited downloads with no watermark, plus co-signer invite links, custom branding, and the biometric identity audit block.'
        },
        {
          q: 'What is the SHA-256 audit trail?',
          a: 'Every signed document receives a SHA-256 cryptographic hash, a unique fingerprint proving the document has not been altered since the moment of signing. This creates a tamper-evident, court-admissible record satisfying both the ESIGN Act and UETA requirements. The hash is embedded in the document footer and included in the audit certificate page.'
        },
      ]
    : [
        {
          q: '¿Codec Document es gratis?',
          a: 'Sí. Nuestro Plan Gratuito te da 18 documentos inteligentes estructurados y 18 firmas digitales gratuitas al mes, sin tarjeta de crédito. A diferencia de plataformas que solo permiten firmar PDFs subidos, el editor de Codec Document construye NDAs, contratos de arrendamiento y acuerdos de servicios desde cero, de forma gratuita. Los planes premium desbloquean documentos ilimitados, QR de co-firmantes y verificación de identidad.'
        },
        {
          q: '¿Cómo se compara con DocuSign o PandaDoc?',
          a: 'Codec Document ofrece un editor inteligente gratuito de plantillas legales, no solo un firmador de PDFs planos. Puedes construir documentos profesionales desde cero, personalizarlos, aplicar tu logo y firmarlos con conformidad ESIGN. Además, la verificación biométrica nativa con selfie + documento de identidad crea un bloque de auditoría embebido que las plataformas tradicionales cobran aparte. Planes premium desde $29.99/mes.'
        },
        {
          q: '¿Las firmas electrónicas son legalmente válidas en EE. UU.?',
          a: 'Sí. Todas las firmas son conformes con la Ley Federal ESIGN (15 U.S.C. § 7001) y la UETA. Cada documento recibe un hash SHA-256, registro de IP, marca de tiempo biométrica y pista de auditoría inmutable, admisibles en tribunales de los 50 estados.'
        },
        {
          q: '¿Estos documentos son válidos en todos los estados de EE. UU.?',
          a: 'Las plantillas incluyen cláusulas legales específicas por estado para los 50 estados de EE. UU., incluyendo California, Texas, Florida y Nueva York. Los documentos adaptan automáticamente los avisos de cumplimiento según el estado seleccionado. Para transacciones complejas, recomendamos revisar con un abogado licenciado.'
        },
        {
          q: '¿Qué es la verificación de identidad biométrica?',
          a: 'Después de firmar, puedes capturar una selfie en vivo y una foto de tu documento de identidad directamente desde el navegador. Estas imágenes se embeben como un bloque de auditoría biométrica dentro del PDF firmado, sin necesidad de app externa. Esto añade una capa adicional de seguridad más allá de la firma digital.'
        },
        {
          q: '¿Puedo ver una vista previa antes de pagar?',
          a: 'Sí. Completa el formulario y previsualiza el documento completo con marca de agua antes de cualquier pago. Los usuarios gratuitos descargan 1 copia limpia cada 72h; los usuarios premium tienen descargas ilimitadas sin marca de agua, enlaces de co-firmante por QR, marca corporativa personalizada y el bloque de auditoría biométrica.'
        },
      ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (user) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setGoogleError(language === 'en' ? 'Google login not configured' : 'Google login no configurado');
      setGoogleReady(false);
      return;
    }

    const initGoogleAuth = () => {
      const googleApi = (window as any).google;
      if (!googleApi?.accounts?.id) {
        setGoogleReady(false);
        return;
      }

      googleApi.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential?: string }) => {
          if (!response?.credential) return;
          try {
            await signInWithGoogleToken(response.credential);
            toast.success(language === 'en' ? 'Login successful' : 'Inicio de sesión exitoso');
          } catch (error: any) {
            const raw = String(error?.message ?? '');
            const isAudienceErr =
              raw.toLowerCase().includes('unacceptable_audience') ||
              raw.toLowerCase().includes('unacceptable audience');
            const message = isAudienceErr
              ? (language === 'en'
                  ? 'Google sign-in is temporarily unavailable. Please try again shortly.'
                  : 'El inicio de sesión con Google no está disponible en este momento. Intenta de nuevo en unos minutos.')
              : raw || (language === 'en' ? 'Google login failed' : 'Falló el login con Google');
            setGoogleError(message);
            toast.error(message);
          }
        },
      });

      googleInitializedRef.current = true;
      setGoogleError(null);
      setGoogleReady(true);

      // One Tap, floating card appears automatically if user has active Google session
      googleApi.accounts.id.prompt();
    };

    if ((window as any).google?.accounts?.id) {
      initGoogleAuth();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', initGoogleAuth, { once: true });
      existingScript.addEventListener('error', () => {
        setGoogleError(language === 'en' ? 'Google script failed to load' : 'No se pudo cargar Google');
        setGoogleReady(false);
      }, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogleAuth;
    script.onerror = () => {
      setGoogleError(language === 'en' ? 'Google script failed to load' : 'No se pudo cargar Google');
      setGoogleReady(false);
    };
    document.head.appendChild(script);
  }, [user, signInWithGoogleToken, language]);

  const lastPricingEmailRef = useRef('');
  useEffect(() => {
    const email = (user?.email || '').toLowerCase();
    // Single-fire guard: skip if already fetched for this email (prevents loops on token refresh)
    if (!email || email === lastPricingEmailRef.current) return;
    lastPricingEmailRef.current = email;
    getSignaturePricingStatus(email).then(setDailyPricing).catch(() => {});
  }, [user?.email]);

  useEffect(() => {
    if (!qrToken || qrStatus === 'SIGNED') return;
    const interval = window.setInterval(async () => {
      try {
        const row = await getSignatureRequestStatus(qrToken);
        if (row?.status === 'COMPLETED' || row?.signatureDataUrl) {
          setQrStatus('SIGNED');
          toast.success(language === 'en' ? 'Signed document received' : 'Documento firmado recibido');
          window.clearInterval(interval);
        }
      } catch {
        // noop
      }
    }, 3000);
    return () => window.clearInterval(interval);
  }, [qrToken, qrStatus, language]);

  const handleUploadForSignature = async (file?: File | null) => {
    if (!file) return;
    pdfRenderJobRef.current += 1;
    if (pdfPagesContainerRef.current) {
      pdfPagesContainerRef.current.innerHTML = '';
    }
    const lowerName = String(file.name || '').toLowerCase();
    const mime = String(file.type || '').toLowerCase();
    const isPdf = mime.includes('pdf') || lowerName.endsWith('.pdf');
    const isImage = mime.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif|bmp)$/i.test(lowerName);

    setUploadFileName(file.name);
    setUploadMimeType(file.type || '');
    setUploadPreviewKind(isPdf ? 'pdf' : isImage ? 'image' : 'unsupported');
    setPreviewRenderFailed(false);
    setSignatureMarker(null);
    setPdfPageCount(0);
    setUploadPdfBytes(null);
    setUploadPreviewUrl('');
    if (isPdf) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array((e.target?.result as ArrayBuffer) || new ArrayBuffer(0));
          if (!typedarray.length) {
            setPreviewRenderFailed(true);
            return;
          }

          // Validar/cargar el PDF directamente desde memoria (sin URL/path)
          await pdfjsLib.getDocument({ data: typedarray }).promise;

          setUploadPdfBytes(typedarray);
          setUploadContent(`data:application/pdf;base64,${uint8ToBase64(typedarray)}`);
        } catch {
          setPreviewRenderFailed(true);
        }
      };
      reader.onerror = () => {
        setPreviewRenderFailed(true);
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setUploadContent(dataUrl);
      setUploadPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const renderPdfPages = async () => {
      if (uploadPreviewKind !== 'pdf' || !uploadPdfBytes) return;
      const currentRenderJob = ++pdfRenderJobRef.current;
      try {
        const pdf = await pdfjsLib
          .getDocument({
            data: uploadPdfBytes,
            cMapPacked: true,
          })
          .promise;

        setPreviewRenderFailed(false);
        setPdfPageCount(pdf.numPages);
        const pagesContainer = pdfPagesContainerRef.current;
        if (!pagesContainer) return;
        pagesContainer.innerHTML = '';

        // Esperar al siguiente paint para asegurar layout estable del contenedor.
        await waitForNextPaint();

        for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex++) {
          if (currentRenderJob !== pdfRenderJobRef.current) return;
          const page = await pdf.getPage(pageIndex);
          const viewport = page.getViewport({ scale: 1.25 });
          const pageWrapper = document.createElement('div');
          pageWrapper.className = 'relative overflow-hidden rounded border bg-white shadow-sm';
          pageWrapper.style.position = 'relative';

          const pageHeader = document.createElement('div');
          pageHeader.className = 'border-b bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600';
          pageHeader.textContent = `${language === 'en' ? 'Page' : 'Página'} ${pageIndex}`;

          const canvas = document.createElement('canvas');
          canvas.className = 'relative z-10 block w-full cursor-crosshair';
          canvas.style.pointerEvents = 'auto';

          const marker = document.createElement('div');
          marker.className = 'absolute z-20 border-2 border-red-600 bg-red-500/20 shadow-[0_0_0_2px_rgba(255,255,255,0.75)]';
          marker.style.width = '84px';
          marker.style.height = '40px';
          marker.style.display = 'none';

          const markerLabel = document.createElement('span');
          markerLabel.className = 'absolute -top-5 left-0 text-[10px] font-bold text-red-700 bg-white/95 px-1 rounded';
          markerLabel.textContent = language === 'en' ? 'SIGN HERE' : 'FIRMAR AQUÍ';
          marker.appendChild(markerLabel);

          canvas.addEventListener('click', (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            const safeX = Math.max(0, Math.min(1, x));
            const safeY = Math.max(0, Math.min(1, y));

            setSignatureMarker({ page: pageIndex, x: safeX, y: safeY });

            const allMarkers = pagesContainer.querySelectorAll<HTMLElement>('[data-sign-marker="true"]');
            allMarkers.forEach((node) => {
              node.style.display = 'none';
            });

            marker.style.left = `calc(${safeX * 100}% - 42px)`;
            marker.style.top = `calc(${safeY * 100}% - 20px)`;
            marker.style.display = 'block';
          });

          marker.setAttribute('data-sign-marker', 'true');

          pageWrapper.appendChild(pageHeader);
          pageWrapper.appendChild(canvas);
          pageWrapper.appendChild(marker);
          pagesContainer.appendChild(pageWrapper);

          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = '100%';
          canvas.style.height = 'auto';

          const renderContext = { canvasContext: context, viewport, canvas };
          try {
            await page.render(renderContext).promise;
          } catch {
            if (currentRenderJob !== pdfRenderJobRef.current) return;
            setPreviewRenderFailed(true);
            continue;
          }
        }
      } catch {
        setPreviewRenderFailed(true);
      }
    };

    void renderPdfPages();

    return () => {
      pdfRenderJobRef.current += 1;
    };
  }, [uploadPreviewKind, uploadPdfBytes]);

  const handleGenerateSignatureQr = async () => {
    if (!user?.email) {
      toast.error(language === 'en' ? 'Sign in first' : 'Primero inicia sesión');
      return;
    }
    if (!uploadContent) {
      toast.error(language === 'en' ? 'Upload a document first' : 'Sube un documento primero');
      return;
    }
    if (uploadPreviewKind === 'unsupported') {
      toast.error(language === 'en' ? 'Please upload a PDF or image file to preview and select signature position.' : 'Sube un archivo PDF o imagen para previsualizar y seleccionar la firma.');
      return;
    }
    if (!signatureMarker) {
      toast.error(language === 'en' ? 'Please mark the signature position in red on the preview.' : 'Marca en rojo la posición de firma en la vista previa.');
      return;
    }
    const normalizedSignerEmail = remoteSignerEmail.trim().toLowerCase();
    const normalizedSignerName = remoteSignerName.trim();
    if (!normalizedSignerEmail || !normalizedSignerName) {
      toast.error(language === 'en' ? 'Enter signer name and email before generating QR/link.' : 'Ingresa nombre y correo del firmante antes de generar el QR/enlace.');
      return;
    }
    try {
      const pricing = await getSignaturePricingStatus(user.email.toLowerCase());
      const markerNote = `SIGN_MARKER:page=${signatureMarker.page},x=${signatureMarker.x.toFixed(4)},y=${signatureMarker.y.toFixed(4)}`;
      const result = await createSignatureRequest({
        orderId: `UPLOAD-${Date.now()}`,
        documentId: 'uploaded-custom-document',
        documentName: uploadFileName || 'Custom uploaded document',
        documentContent: uploadContent,
        buyerEmail: user.email,
        buyerName: user.name || 'Cliente',
        signerEmail: normalizedSignerEmail,
        signerName: normalizedSignerName,
        contractSignerName: normalizedSignerName,
        signaturePlacement: 'right',
        signaturePlacementNotes: markerNote,
        signatureCoordinates: {
          page_number: signatureMarker.page,
          x_coordinate: signatureMarker.x,
          y_coordinate: signatureMarker.y,
        },
        feePaymentConfirmed: false,
      });
      setDailyPricing(pricing);
      setQrLink(result.guestLink);
      setQrToken(result.token);
      setQrStatus('PENDING');
      toast.success(language === 'en' ? 'QR generated successfully' : 'QR generado correctamente');
    } catch (e: any) {
      if (String(e?.message || '').includes('PAYMENT_REQUIRED_FOR_SIGNATURE_REQUEST')) {
        toast.error(language === 'en' ? 'This extra signature request requires a USD 3 payment.' : 'Esta solicitud adicional de firma requiere un pago de USD 3.');
        return;
      }
      toast.error(e?.message || (language === 'en' ? 'Could not generate QR' : 'No se pudo generar el QR'));
    }
  };

  const handlePreviewClick = (event: React.MouseEvent<HTMLElement>, pageNumber: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const safeX = Math.max(0, Math.min(1, x));
    const safeY = Math.max(0, Math.min(1, y));
    setSignatureMarker({ page: pageNumber, x: safeX, y: safeY });
  };

  // Mobile visitors never see this page's body, they're redirected to
  // /app by the effect above. Returning null here (instead of rendering
  // the full landing then redirecting) avoids a flash of the desktop
  // landing/hero on a phone before the redirect fires.
  if (isMobile) return null;

  return (
    <div className="min-h-screen bg-white" style={{ scrollBehavior: 'smooth' }}>
      <SEOHead
        title={language === 'en'
          ? 'Codec Document | Free Legal Documents & E-Signatures | ESIGN Act Compliant'
          : 'Codec Document | Documentos Legales Gratis y Firma Electrónica | Conforme ESIGN'}
        description={language === 'en'
          ? 'Generate, customize, and e-sign legal documents for free. NDA, residential lease agreements, service contracts for all 50 US states. Free intelligent editor + 2 free e-signatures/day. No credit card required. ESIGN Act & UETA compliant, SHA-256 audit trail.'
          : 'Genera, personaliza y firma digitalmente documentos legales gratis. NDA, contratos de arrendamiento, acuerdos de servicios para los 50 estados de EE. UU. Editor inteligente gratuito + 2 firmas gratis al día. Sin tarjeta de crédito. Conforme ESIGN y UETA.'}
        keywords={language === 'en'
          ? 'free legal documents online, free electronic signature, free NDA template, free lease agreement USA, free contract generator, esign act compliant, ueta compliant, digital signature free, legal document generator, online document signing, free business contract, independent contractor agreement free, free service agreement, document signing without credit card, pandadoc alternative free, docusign alternative free'
          : 'documentos legales gratis, firma electrónica gratis, plantilla NDA gratis, contrato arrendamiento gratis USA, generador contrato gratis, conforme esign act, firma digital gratis, generador documentos legales, firma documentos online gratis'}
        canonicalUrl={typeof window !== 'undefined' ? window.location.origin : SITE_URL}
      />
      <StructuredData />

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <header
        className={[
          'sticky top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-slate-200 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl'
            : 'border-b border-transparent bg-white',
        ].join(' ')}
      >
        {/* Top accent line, the logo's own gradient, thin */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />

        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">

            {/* ── Logo ───────────────────────────────────────────────────── */}
            <a href="/" className="group flex items-center gap-2.5">
              <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_2px_10px_rgba(79,70,229,0.35)] transition-shadow duration-300 group-hover:shadow-[0_4px_16px_rgba(79,70,229,0.5)]">
                <Shield className="size-5 text-white" />
                <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
              </div>
              <div>
                <span translate="no" className="notranslate block text-base font-black tracking-tight text-slate-900">
                  Codec <span className="text-indigo-600">Document</span>
                </span>
                <span className="block text-[10px] font-medium text-slate-400 leading-none">
                  {language === 'en' ? 'Legal · Signatures · AI' : 'Legal · Firmas · IA'}
                </span>
              </div>
            </a>

            {/* ── Nav (desktop) ──────────────────────────────────────────── */}
            <nav className="hidden items-center gap-1 md:flex">
              {/* Documents dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDocumentsMenu((prev) => !prev)}
                  className="group flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
                >
                  <FolderOpen className="size-4" />
                  {language === 'en' ? 'Templates' : 'Plantillas'}
                  <ChevronDown className={`size-3.5 transition-transform duration-200 ${showDocumentsMenu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showDocumentsMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-1 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.14)]"
                    >
                      <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {language === 'en' ? 'Catalog' : 'Catálogo'}
                      </p>
                      <ul className="max-h-64 space-y-0.5 overflow-auto">
                        {featuredDocuments.map((doc) => (
                          <li key={doc.id}>
                            <button
                              type="button"
                              className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                              onClick={() => { setShowDocumentsMenu(false); navigate(`/generator/${doc.id}`); }}
                            >
                              {doc.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Platform showcase, hover/click reveals the full process
                  (create → send → validate → sign → follow-up) plus the
                  voice-guide and security/certification highlights, to
                  build trust before asking anyone to sign up. Replaces the
                  old "Free Docs" link, which had no real function here. */}
              <div
                className="relative"
                onMouseEnter={() => setShowPlatformMenu(true)}
                onMouseLeave={() => {
                  // Opening the info popup mounts a fixed full-screen overlay
                  // right on top of the cursor, which makes the browser fire
                  // a native mouseleave on this wrapper even though the user
                  // never actually moved off it, without this guard, the
                  // whole Platform panel would vanish behind the popup the
                  // instant a security-feature or law card was clicked.
                  if (infoModal) return;
                  setShowPlatformMenu(false);
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowPlatformMenu((prev) => !prev)}
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
                >
                  <Layers className="size-4" />
                  {language === 'en' ? 'Platform' : 'Plataforma'}
                  <ChevronDown className={`size-3.5 transition-transform duration-200 ${showPlatformMenu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showPlatformMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute left-1/2 mt-1 w-[46rem] max-w-[92vw] -translate-x-1/2 overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_30px_70px_rgba(15,23,42,0.18)]"
                    >
                      {/* Process strip */}
                      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {language === 'en' ? 'How it works' : 'Cómo funciona'}
                      </p>
                      <motion.div
                        className="flex items-start justify-between"
                        initial="hidden"
                        animate="show"
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                      >
                        {[
                          { icon: FileText, en: 'Create', es: 'Se crea' },
                          { icon: Send, en: 'Send', es: 'Se envía' },
                          { icon: ShieldCheck, en: 'Validate', es: 'Se valida' },
                          { icon: PenLine, en: 'Sign', es: 'Se firma' },
                          { icon: BadgeCheck, en: 'Follow-up', es: 'Acompañamiento' },
                        ].map((step, idx) => {
                          const StepIcon = step.icon;
                          return (
                            <motion.div
                              key={step.en}
                              className="flex flex-1 flex-col items-center text-center"
                              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                            >
                              <div className="relative flex w-full items-center">
                                {idx > 0 && <span className="absolute -left-1/2 right-1/2 top-4 h-px bg-gradient-to-r from-blue-200 to-indigo-200" />}
                                <span className="relative z-10 mx-auto flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_2px_8px_rgba(79,70,229,0.35)]">
                                  <StepIcon className="size-4" />
                                </span>
                              </div>
                              <p className="mt-2 text-[11px] font-bold text-slate-700">{language === 'en' ? step.en : step.es}</p>
                            </motion.div>
                          );
                        })}
                      </motion.div>

                      {/* Security & permissions the client can turn on per document
                         , the real SecurityConfig flags (sign-transaction-service.ts),
                          each its own color so it reads as "look how much is already
                          built", not one generic checklist line. */}
                      <p className="mb-3 mt-7 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {language === 'en' ? 'Security your clients can activate' : 'Seguridad que tus clientes pueden activar'}
                      </p>
                      <motion.div
                        className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
                        initial="hidden"
                        animate="show"
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } } }}
                      >
                        {[
                          { icon: PenLine, en: 'Standard Signature', es: 'Firma Estándar', color: '#2563eb',
                            descEn: 'The signer draws or types their signature directly on the document before sending it.',
                            descEs: 'El firmante dibuja o escribe su firma directamente sobre el documento antes de enviarlo.' },
                          { icon: Camera, en: 'Selfie', es: 'Selfie', color: '#4f46e5',
                            descEn: 'The signer takes a selfie at the moment of signing, confirming a real person signed, not just a typed name.',
                            descEs: 'Se le pide al firmante tomarse una selfie justo al firmar, para confirmar que es una persona real y no solo un nombre escrito.' },
                          { icon: CreditCard, en: 'ID Photo', es: 'Foto de Identificación', color: '#7c3aed',
                            descEn: 'The signer is asked to photograph their ID so it stays attached to the signed document as proof of identity.',
                            descEs: 'Se le pide a la otra persona que tome una foto de su identificación, para que quede registrada en el documento como prueba de identidad.' },
                          { icon: Smartphone, en: 'SMS Code', es: 'Código SMS', color: '#0284c7',
                            descEn: 'A one-time code is sent by SMS to the signer\'s phone before the signature can be completed.',
                            descEs: 'Se envía un código de un solo uso por SMS al número del firmante antes de poder completar la firma.' },
                          { icon: FileCheck, en: 'E-Sign Consent', es: 'Consentimiento E-Sign', color: '#0891b2',
                            descEn: 'The signer must explicitly accept a short legal consent statement before signing electronically.',
                            descEs: 'El firmante debe aceptar de forma explícita un texto legal de consentimiento antes de firmar electrónicamente.' },
                          { icon: Search, en: 'Advanced Audit Trail', es: 'Auditoría Avanzada', color: '#d97706',
                            descEn: 'Every signature is logged with date, time, IP address and browser, in a tamper-evident audit trail.',
                            descEs: 'Cada firma queda registrada con fecha, hora, IP y navegador, en una pista de auditoría imposible de alterar.' },
                          { icon: Fingerprint, en: 'Biometric Verification', es: 'Verificación Biométrica', color: '#a21caf',
                            descEn: 'The signer confirms their identity with Face ID, Touch ID or Windows Hello on their own device.',
                            descEs: 'El firmante confirma su identidad con Face ID, Touch ID o Windows Hello en su propio dispositivo.' },
                        ].map((perm) => {
                          const PermIcon = perm.icon;
                          return (
                            <motion.button
                              key={perm.en}
                              type="button"
                              onClick={() => setInfoModal({ icon: perm.icon, color: perm.color, title: language === 'en' ? perm.en : perm.es, desc: language === 'en' ? perm.descEn : perm.descEs })}
                              variants={{ hidden: { opacity: 0, y: 10, scale: 0.94 }, show: { opacity: 1, y: 0, scale: 1 } }}
                              whileHover={{ y: -3, scale: 1.03 }}
                              className="flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-shadow"
                              style={{
                                background: `linear-gradient(160deg, ${perm.color}14 0%, ${perm.color}05 100%)`,
                                borderColor: `${perm.color}30`,
                                boxShadow: `0 6px 16px -8px ${perm.color}55`,
                              }}
                            >
                              <span
                                className="flex size-8 items-center justify-center rounded-xl text-white"
                                style={{ background: `linear-gradient(145deg, ${perm.color}, ${perm.color}cc)`, boxShadow: `0 3px 8px ${perm.color}66` }}
                              >
                                <PermIcon className="size-4" />
                              </span>
                              <span className="text-[11px] font-bold leading-tight text-slate-700">
                                {language === 'en' ? perm.en : perm.es}
                              </span>
                            </motion.button>
                          );
                        })}

                        {/* Voice guide, its own bigger, more prominent card
                            instead of a thin footnote line. Clicking it
                            actually demos the assistant instead of just
                            describing it, using the exact same
                            voiceAssistant.speak() every signing flow uses. */}
                        <motion.button
                          type="button"
                          onClick={() => {
                            setVoiceDemoPlaying(true);
                            voiceAssistant.speak(
                              { en: "I'm here to help you complete your documents, or sign them.", es: 'Estoy aquí para ayudarte a completar tus documentos, o firmarlos.' },
                              language,
                            );
                            window.setTimeout(() => setVoiceDemoPlaying(false), 4000);
                          }}
                          variants={{ hidden: { opacity: 0, y: 10, scale: 0.94 }, show: { opacity: 1, y: 0, scale: 1 } }}
                          whileHover={{ y: -3, scale: 1.03 }}
                          className="col-span-2 flex items-center gap-3 rounded-2xl border p-3 text-left"
                          style={{
                            background: 'linear-gradient(135deg, #4f46e514 0%, #2563eb08 100%)',
                            borderColor: '#4f46e530',
                            boxShadow: '0 6px 16px -8px #4f46e555',
                          }}
                        >
                          <span
                            className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-white ${voiceDemoPlaying ? 'animate-pulse' : ''}`}
                            style={{ background: 'linear-gradient(145deg, #4f46e5, #2563eb)', boxShadow: '0 3px 8px #4f46e566' }}
                          >
                            <Volume2 className="size-5" />
                          </span>
                          <div>
                            <p className="text-xs font-black text-slate-900">{language === 'en' ? 'Voice Guide' : 'Guía por Voz'}</p>
                            <p className="text-[11px] leading-tight text-slate-500">
                              {voiceDemoPlaying
                                ? (language === 'en' ? 'Speaking now…' : 'Hablando ahora…')
                                : (language === 'en' ? 'Walks every signer through each step, out loud, click to hear it' : 'Acompaña a cada firmante paso a paso, en voz alta, clic para escucharlo')}
                            </p>
                          </div>
                        </motion.button>
                      </motion.div>

                      {/* Where it's available, same markets as the SEO pages */}
                      <p className="mb-2 mt-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {language === 'en' ? 'Available in' : 'Disponible en'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <span>🇺🇸</span> {language === 'en' ? 'United States' : 'Estados Unidos'}
                        </span>
                        {LATAM_COUNTRIES.map((c) => (
                          <a
                            key={c.slug}
                            href={`/firma-electronica-${c.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-indigo-600"
                          >
                            <span>{c.flag}</span> {language === 'en' ? c.name : c.nameEs}
                          </a>
                        ))}
                      </div>

                      {/* Compliance strip, geolocation-aware: a visitor
                          detected in one of the 6 LatAm countries sees THAT
                          country's real law badge instead of the US ESIGN
                          Act/UETA claims, which don't apply outside the US
                          (same principle as the SEO landing pages). Each
                          badge is clickable and opens the same info popup. */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-2.5">
                        {effectiveIsLatam ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setInfoModal({
                                icon: ShieldCheck, color: '#059669',
                                title: matchedLatamCountry ? (language === 'en' ? matchedLatamCountry.lawBadgeEn : matchedLatamCountry.lawBadgeEs) : (language === 'en' ? 'Local E-Signature Law' : 'Ley Local de Firma Electrónica'),
                                desc: matchedLatamCountry ? (language === 'en' ? matchedLatamCountry.highlights[0]?.factEn ?? '' : matchedLatamCountry.highlights[0]?.factEs ?? '') : (language === 'en' ? 'Electronic signatures are legally recognized across Latin America, Codec Document adapts the certificate to each country\'s real law.' : 'Las firmas electrónicas tienen reconocimiento legal en toda Latinoamérica, Codec Document adapta el certificado a la ley real de cada país.'),
                              })}
                              className="flex items-center gap-1.5 transition hover:opacity-70"
                            >
                              <ShieldCheck className="size-3.5 text-emerald-600" />
                              <span className="text-[11px] font-bold text-emerald-700">
                                {matchedLatamCountry ? (language === 'en' ? matchedLatamCountry.lawBadgeEn : matchedLatamCountry.lawBadgeEs) : (language === 'en' ? 'Local Law' : 'Ley Local')}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setInfoModal({ icon: ShieldCheck, color: '#059669', title: 'SHA-256', desc: language === 'en' ? 'Every signed document receives a unique cryptographic fingerprint proving it was never altered after signing.' : 'Cada documento firmado recibe una huella digital criptográfica única que prueba que nunca fue alterado después de firmarse.' })}
                              className="flex items-center gap-1.5 transition hover:opacity-70"
                            >
                              <ShieldCheck className="size-3.5 text-emerald-600" />
                              <span className="text-[11px] font-bold text-emerald-700">SHA-256</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setInfoModal({ icon: ShieldCheck, color: '#059669', title: 'ESIGN Act', desc: language === 'en' ? 'US federal law (15 U.S.C. § 7001) giving electronic signatures the same legal validity as a signature on paper.' : 'Ley federal de EE. UU. (15 U.S.C. § 7001) que da a las firmas electrónicas la misma validez legal que una firma en papel.' })}
                              className="flex items-center gap-1.5 transition hover:opacity-70"
                            >
                              <ShieldCheck className="size-3.5 text-emerald-600" />
                              <span className="text-[11px] font-bold text-emerald-700">ESIGN Act</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setInfoModal({ icon: ShieldCheck, color: '#059669', title: 'UETA', desc: language === 'en' ? 'Uniform law adopted by all 50 US states recognizing the validity of electronic contracts and signatures.' : 'Ley uniforme adoptada por los 50 estados de EE. UU. que reconoce la validez de contratos y firmas electrónicas.' })}
                              className="flex items-center gap-1.5 transition hover:opacity-70"
                            >
                              <ShieldCheck className="size-3.5 text-emerald-600" />
                              <span className="text-[11px] font-bold text-emerald-700">UETA</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setInfoModal({ icon: ShieldCheck, color: '#059669', title: 'SHA-256', desc: language === 'en' ? 'Every signed document receives a unique cryptographic fingerprint proving it was never altered after signing.' : 'Cada documento firmado recibe una huella digital criptográfica única que prueba que nunca fue alterado después de firmarse.' })}
                              className="flex items-center gap-1.5 transition hover:opacity-70"
                            >
                              <ShieldCheck className="size-3.5 text-emerald-600" />
                              <span className="text-[11px] font-bold text-emerald-700">SHA-256</span>
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <a
                href="/firma-electronica"
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <QrCode className="size-4" />
                {language === 'en' ? 'Signatures' : 'Firmas'}
              </a>

              {/* Pricing, its own page now */}
              <Link
                to="/pricing"
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {language === 'en' ? 'Pricing' : 'Precios'}
              </Link>
            </nav>

            {/* ── Right actions ─────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
              {/* Talk to sales, mirrors the ZapSign-style "Hablar con ventas"
                  ghost button, wired to the real Calendar/Meet booking link. */}
              <a
                href={MEETING_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <CalendarClock className="size-3.5" />
                {language === 'en' ? 'Talk to sales' : 'Hablar con ventas'}
              </a>

              {/* Signature CTA, signed-out visitors get the signup popup
                  (with a "you must register to sign" context message)
                  instead of landing on /firma-electronica with no account. */}
              <a
                href="/firma-electronica"
                onClick={(e) => { if (!user) { e.preventDefault(); requireAuthToSign(); } }}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-[0_2px_10px_rgba(79,70,229,0.35)] transition-all hover:shadow-[0_4px_16px_rgba(79,70,229,0.5)]"
              >
                <PenLine className="size-3.5" />
                {language === 'en' ? 'Sign now' : 'Firmar ahora'}
              </a>

              {/* Google login OR user avatar */}
              {!user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <span className="hidden xl:inline text-[11px] font-semibold text-slate-400">
                    {language === 'en' ? 'No credit card required' : 'Sin tarjeta de crédito'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOnboardingOpen(true)}
                    className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-4 py-2 text-sm font-bold text-white shadow-[0_2px_10px_rgba(79,70,229,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(79,70,229,0.5)] active:translate-y-0"
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)' }}
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    {language === 'en' ? 'Try free' : 'Prueba gratis'}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu((prev) => !prev)}
                    className="group flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 pl-1 pr-3 py-1 transition hover:border-slate-300 hover:bg-slate-100"
                  >
                    {user.picture ? (
                      <img src={user.picture} alt="Perfil" className="size-7 rounded-xl object-cover ring-1 ring-slate-200" />
                    ) : (
                      <span className="flex size-7 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                        <User className="size-3.5 text-indigo-600" />
                      </span>
                    )}
                    <span className="hidden max-w-[120px] truncate text-xs font-semibold text-slate-700 sm:block">
                      {user.name || user.email}
                    </span>
                    <ChevronDown className={`size-3.5 text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.14)]"
                      >
                        {/* User info */}
                        <div className="mb-1.5 border-b border-slate-100 px-3 pb-2 pt-1">
                          <p className="text-xs font-bold text-slate-900">{user.name || 'Usuario'}</p>
                          <p className="truncate text-[10px] text-slate-400">{user.email}</p>
                        </div>
                        {[
                          { icon: FileText, label: language === 'en' ? 'My Documents' : 'Mis documentos', action: () => { navigate('/my-documents'); setShowUserMenu(false); } },
                          { icon: Settings, label: language === 'en' ? 'My Subscription' : 'Mi Suscripción', action: () => { setShowUserMenu(false); navigate('/pricing'); } },
                        ].map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <button
                              key={item.label}
                              type="button"
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                              onClick={item.action}
                            >
                              <ItemIcon className="size-4 text-slate-400" />
                              {item.label}
                            </button>
                          );
                        })}
                        <div className="mt-1 border-t border-slate-100 pt-1">
                          <button
                            type="button"
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-500 transition hover:bg-red-50"
                            onClick={() => { logout(); setShowUserMenu(false); }}
                          >
                            <LogOut className="size-4" />
                            {language === 'en' ? 'Sign out' : 'Cerrar sesión'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <LanguageToggle />

              {/* Hamburger, mobile only */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((p) => !p)}
                aria-label="Menu"
                className="md:hidden flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="2" y1="2" x2="14" y2="14"/><line x1="14" y1="2" x2="2" y2="14"/>
                    </motion.svg>
                  ) : (
                    <motion.svg key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/>
                    </motion.svg>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-slate-200 bg-white md:hidden"
            >
              <div className="container mx-auto px-4 py-4 space-y-1">
                {/* Templates */}
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); document.getElementById('documents-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <FolderOpen className="size-4 text-blue-500" />
                  {language === 'en' ? 'Templates' : 'Plantillas'}
                </button>
                {/* Signatures */}
                <a
                  href="/firma-electronica"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <QrCode className="size-4 text-indigo-500" />
                  {language === 'en' ? 'E-Signatures' : 'Firmas Electrónicas'}
                </a>
                {/* Pricing */}
                <Link
                  to="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <Star className="size-4 text-amber-500" />
                  {language === 'en' ? 'Plans & Pricing' : 'Planes y Precios'}
                </Link>
                {/* Talk to sales */}
                <a
                  href={MEETING_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <CalendarClock className="size-4 text-slate-400" />
                  {language === 'en' ? 'Talk to sales' : 'Hablar con ventas'}
                </a>

                {user ? (
                  <>
                    <div className="my-2 h-px bg-slate-100" />
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); navigate('/my-documents'); }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <FileText className="size-4 text-slate-400" />
                      {language === 'en' ? 'My Documents' : 'Mis Documentos'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); logout(); }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      <LogOut className="size-4" />
                      {language === 'en' ? 'Sign out' : 'Cerrar sesión'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="my-2 h-px bg-slate-100" />
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); setOnboardingOpen(true); }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)' }}
                    >
                      {language === 'en' ? 'Get Started Free' : 'Empezar Gratis'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* This whole page is desktop-only now (mobile redirects to /app
          above), so the hero always renders, no mobile branching left. */}
      {effectiveIsLatam ? <LatamHero onRequireAuth={requireAuthToUseTemplate} /> : <ModernHero onRequireAuth={requireAuthToUseTemplate} />}

      {/* US document templates, hidden entirely for a visitor detected
          outside the US (LatamHero above is their actual home experience),
          since these templates mean nothing for a Colombian rental or an
          Argentine NDA. Exception: the account owner's own admin email
          always sees both interfaces, needed to review/demo either market
          regardless of where they're actually connecting from. */}
      {(!effectiveIsLatam || isAdminEmail(user?.email)) && (
        <section id="documents-section">
          {effectiveIsLatam && (
            <div className="bg-slate-50 pt-14 text-center">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
                {language === 'en' ? 'For property or business in the US' : 'Para propiedades o negocios en EE. UU.'}
              </span>
              <h2
                className="mx-auto max-w-xl bg-clip-text px-4 py-1 text-2xl font-black leading-snug text-transparent md:text-3xl"
                style={{ backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #2563eb 55%, #4f46e5 100%)' }}
              >
                {language === 'en' ? 'Legal Documents for the United States' : 'Documentos Legales para Estados Unidos'}
              </h2>
              <p className="mx-auto mt-2 max-w-lg px-4 text-sm text-slate-500">
                {language === 'en'
                  ? 'State-specific templates for NDAs, leases, contracts and more, for property or business you have in the US.'
                  : 'Plantillas específicas por estado para NDA, arrendamientos, contratos y más, para propiedades o negocios que tengas en EE. UU.'}
              </p>
            </div>
          )}
          <DocumentBentoGrid documents={filteredDocuments} />
        </section>
      )}

      {/* How It Works, 4 steps matching the app flow */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40 py-16 md:py-28">
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
                {language === 'en' ? 'Simple Process' : 'Proceso Simple'}
              </span>
              <h2
                className="bg-clip-text py-1 text-3xl font-black leading-snug text-transparent md:text-5xl"
                style={{ backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #2563eb 55%, #4f46e5 100%)' }}
              >
                {language === 'en' ? 'Ready in 4 Steps' : 'Listo en 4 Pasos'}
              </h2>
              <p className="mt-3 text-base text-slate-500 max-w-2xl mx-auto md:text-lg">
                {language === 'en'
                  ? 'From blank form to legally binding signed document, in under 5 minutes.'
                  : 'Del formulario en blanco al documento firmado con validez legal, en menos de 5 minutos.'}
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
              {[
                {
                  step: '01',
                  icon: FileText,
                  grad: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 45%, #1d4ed8 100%)',
                  ledge: '#1e3a8a', glowRgba: 'rgba(37,99,235,0.45)',
                  titleEn: 'Fill the Form',
                  titleEs: 'Llena el Formulario',
                  descEn: "Select your template and fill in the parties' details. Get a real-time preview of your legal document.",
                  descEs: 'Selecciona la plantilla y completa los datos de las partes. Previsualización en tiempo real.',
                },
                {
                  step: '02',
                  icon: PenLine,
                  grad: 'linear-gradient(180deg, #a5b4fc 0%, #6366f1 45%, #4338ca 100%)',
                  ledge: '#312e81', glowRgba: 'rgba(99,102,241,0.45)',
                  titleEn: 'Sign Digitally',
                  titleEs: 'Firma Digitalmente',
                  descEn: 'Draw your e-signature or send a unique QR link to co-signers. Sign from any device, anywhere.',
                  descEs: 'Dibuja tu firma electrónica o envía un enlace QR único a co-firmantes. Desde cualquier dispositivo.',
                },
                {
                  step: '03',
                  icon: Camera,
                  grad: 'linear-gradient(180deg, #c4b5fd 0%, #9333ea 45%, #6b21a8 100%)',
                  ledge: '#581c87', glowRgba: 'rgba(147,51,234,0.45)',
                  titleEn: 'Verify Identity',
                  titleEs: 'Verifica Identidad',
                  descEn: 'Capture a live selfie + ID photo. Biometric proof is embedded directly inside your signed PDF.',
                  descEs: 'Captura selfie + foto de ID. La prueba biométrica queda embebida dentro del PDF firmado.',
                },
                {
                  step: '04',
                  icon: Download,
                  grad: 'linear-gradient(180deg, #6ee7b7 0%, #10b981 45%, #047857 100%)',
                  ledge: '#065f46', glowRgba: 'rgba(16,185,129,0.45)',
                  titleEn: 'Download PDF',
                  titleEs: 'Descarga el PDF',
                  descEn: 'Receive a clean, watermark-free PDF with SHA-256 audit trail, court-admissible in all 50 states.',
                  descEs: 'Recibe un PDF limpio con pista de auditoría SHA-256, admisible en tribunales de los 50 estados.',
                },
              ].map((s, idx) => {
                const StepIcon = s.icon;
                return (
                  <motion.div
                    key={s.step}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 pt-8 shadow-[0_4px_20px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.12)]"
                  >
                    {/* Accent bar */}
                    <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: s.grad }} />
                    {/* Connector dashes between steps */}
                    {idx < 3 && (
                      <div className="absolute -right-3 top-1/2 z-10 hidden h-px w-6 -translate-y-1/2 border-t-2 border-dashed border-slate-300 lg:block" />
                    )}
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-110"
                        style={{ background: s.grad, boxShadow: `0 4px 0 ${s.ledge}, 0 8px 20px ${s.glowRgba}` }}
                      >
                        <StepIcon className="size-5" />
                      </div>
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                        style={{ background: s.grad, boxShadow: `0 2px 0 ${s.ledge}, 0 4px 10px ${s.glowRgba}` }}
                      >
                        {s.step}
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-black text-slate-900">
                      {language === 'en' ? s.titleEn : s.titleEs}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {language === 'en' ? s.descEn : s.descEs}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA under steps */}
            <div className="mt-12 text-center">
              <a
                href="/firma-electronica"
                className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-[0_4px_24px_rgba(99,102,241,0.40)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(99,102,241,0.55)]"
              >
                {language === 'en' ? 'Start your first document' : 'Empieza tu primer documento'}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Codec Document, educational + sales case, photo-led. Each
          card uses one of the "pointing"/portrait studio photos with a
          caption overlaid directly on the photo (not a slideshow, all 3
          render at once, side by side). The third card also carries the
          new shield logo mark as a small floating badge, since that's the
          "why trust us" card. */}
      <section className="relative overflow-hidden bg-white pb-0 pt-16 md:pt-28">
        {/* Same soft gradient + glow the "Plantillas Prediseñadas" section
            below uses, the two sections share one continuous background
            (no bg-white → bg-white seam with a hard edge between them),
            so they read as one flowing chapter instead of stacked cards. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-white to-blue-50/60" />
        <div className="pointer-events-none absolute right-1/4 bottom-0 size-[26rem] translate-y-1/3 rounded-full bg-violet-400/15 blur-[110px]" />
        <div className="container relative mx-auto px-4 pb-10 md:pb-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
                {language === 'en' ? 'Why Codec Document' : 'Por Qué Codec Document'}
              </span>
              <h2
                className="bg-clip-text py-1 text-3xl font-black leading-snug text-transparent md:text-5xl"
                style={{ backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #2563eb 55%, #4f46e5 100%)' }}
              >
                {language === 'en' ? 'Why sign digitally with us?' : '¿Por qué firmar digital con nosotros?'}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-slate-500 md:text-lg">
                {language === 'en'
                  ? 'Everything you need to know about creating, signing and verifying legal documents, in one place.'
                  : 'Todo lo que necesitas saber sobre crear, firmar y verificar documentos legales, en un mismo lugar.'}
              </p>
            </div>

            <div className="space-y-20 md:space-y-28">
              {[
                {
                  image: '/images/home/why-1-pointing.jpg',
                  grad: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 45%, #1d4ed8 100%)',
                  ledge: '#1e3a8a', glowRgba: 'rgba(37,99,235,0.45)', accent: '#2563eb',
                  kickerEn: 'What we do', kickerEs: 'Qué hacemos',
                  captionEn: 'One platform, start to finish', captionEs: 'Una sola plataforma, de principio a fin',
                  titleEn: 'Your whole legal workflow, in one place',
                  titleEs: 'Todo el proceso legal, en un solo lugar',
                  bodyEn: "We generate the document, collect every party's e-signature, and verify the signer's identity, no printing, scanning, or chasing paperwork.",
                  bodyEs: 'Generamos el documento, recogemos la firma electrónica de todas las partes y verificamos la identidad del firmante, sin imprimir, escanear ni perseguir papeles.',
                  pointsEn: ['Ready-made legal templates', 'Real-time document preview'],
                  pointsEs: ['Plantillas legales ya redactadas', 'Previsualización en tiempo real'],
                },
                {
                  image: '/images/home/why-2-pointing.jpg',
                  grad: 'linear-gradient(180deg, #c4b5fd 0%, #9333ea 45%, #6b21a8 100%)',
                  ledge: '#581c87', glowRgba: 'rgba(147,51,234,0.45)', accent: '#9333ea',
                  kickerEn: 'Why e-sign', kickerEs: 'Por qué la firma digital',
                  captionEn: 'Same validity. More proof.', captionEs: 'Misma validez. Más evidencia.',
                  titleEn: 'Just as valid as pen and paper, with more evidence',
                  titleEs: 'Tan válida como firmar en papel, pero con más evidencia',
                  bodyEn: 'The ESIGN Act and UETA recognize electronic signatures as legally binding across the US. Every signature carries an audit trail, geolocation and biometric verification, something a pen never gives you.',
                  bodyEs: 'La Ley ESIGN y UETA reconocen la firma electrónica como vinculante en EE. UU. Cada firma incluye auditoría, geolocalización y verificación biométrica, algo que un bolígrafo nunca podrá darte.',
                  pointsEn: ['SHA-256 audit trail on every signature', 'Geolocation + biometric proof'],
                  pointsEs: ['Pista de auditoría SHA-256 en cada firma', 'Geolocalización + prueba biométrica'],
                },
                {
                  image: '/images/home/why-3-confident.jpg',
                  grad: 'linear-gradient(180deg, #6ee7b7 0%, #10b981 45%, #047857 100%)',
                  ledge: '#065f46', glowRgba: 'rgba(16,185,129,0.45)', accent: '#059669',
                  kickerEn: 'Why Codec Document', kickerEs: 'Por qué Codec Document',
                  captionEn: 'Your best option, end to end', captionEs: 'Tu mejor opción, de punta a punta',
                  titleEn: 'The most complete way to sign and verify',
                  titleEs: 'La opción más completa para firmar y verificar',
                  bodyEn: 'Ready-to-use legal templates, identity verification, biometric evidence and support in Spanish and English, all integrated, without juggling separate tools.',
                  bodyEs: 'Plantillas legales listas para usar, verificación de identidad, evidencia biométrica y soporte en español e inglés, todo integrado, sin depender de herramientas sueltas.',
                  pointsEn: ['Support in Spanish and English', 'Everything integrated, nothing to piece together'],
                  pointsEs: ['Soporte en español e inglés', 'Todo integrado, nada que armar por separado'],
                },
              ].map((c, idx) => {
                const reversed = idx % 2 === 1;
                return (
                  <div
                    key={c.titleEn}
                    className={`flex flex-col items-center gap-10 md:gap-16 ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'}`}
                  >
                    {/* Image side */}
                    <motion.div
                      initial={{ opacity: 0, x: reversed ? 40 : -40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="relative w-full md:w-1/2"
                    >
                      <div className="pointer-events-none absolute -inset-4 rounded-[2rem] opacity-30 blur-2xl" style={{ background: c.grad }} />
                      <div className="group relative overflow-hidden rounded-3xl shadow-xl shadow-slate-900/10">
                        <img
                          src={c.image}
                          alt=""
                          className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <span
                            className="mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white"
                            style={{ background: c.grad, boxShadow: `0 2px 0 ${c.ledge}, 0 4px 10px ${c.glowRgba}` }}
                          >
                            {language === 'en' ? c.kickerEn : c.kickerEs}
                          </span>
                          <p className="text-base font-black leading-snug text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-lg">
                            {language === 'en' ? c.captionEn : c.captionEs}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Text side */}
                    <motion.div
                      initial={{ opacity: 0, x: reversed ? -40 : 40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full md:w-1/2"
                    >
                      <span
                        className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white"
                        style={{ background: c.grad, boxShadow: `0 3px 0 ${c.ledge}, 0 6px 16px ${c.glowRgba}` }}
                      >
                        {language === 'en' ? c.kickerEn : c.kickerEs}
                      </span>
                      <h3 className="mb-3 text-2xl font-black leading-tight md:text-3xl">
                        <span style={{ color: c.accent }}>{(language === 'en' ? c.titleEn : c.titleEs).split(' ').slice(0, 2).join(' ')}</span>
                        {' '}
                        <span className="text-slate-900">{(language === 'en' ? c.titleEn : c.titleEs).split(' ').slice(2).join(' ')}</span>
                      </h3>
                      <p className="text-base leading-relaxed text-slate-600">
                        {language === 'en' ? c.bodyEn : c.bodyEs}
                      </p>
                      <ul className="mt-5 space-y-2.5">
                        {(language === 'en' ? c.pointsEn : c.pointsEs).map((point) => (
                          <li key={point} className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                            <span
                              className="flex size-5 shrink-0 items-center justify-center rounded-full"
                              style={{ background: c.grad, boxShadow: `0 2px 0 ${c.ledge}` }}
                            >
                              <Check className="size-3 text-white" />
                            </span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Pre-made templates for every industry, real photo + copy on a
          light, layered-glow background (kept light on purpose: the "Do
          more" section right below is already dark, so two dark bands in
          a row would blend together with no separation), then a
          monochrome infinite marquee of the real sector landing pages
          this site already has (profession-seo-content.ts). */}
      <section className="relative overflow-hidden bg-white pb-20 pt-10 md:pb-28 md:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/70 via-white to-violet-50/60" />
        <div className="pointer-events-none absolute left-1/4 top-0 size-[28rem] -translate-y-1/2 rounded-full bg-blue-400/20 blur-[110px]" />
        <div className="pointer-events-none absolute right-1/4 bottom-0 size-[28rem] translate-y-1/2 rounded-full bg-violet-400/20 blur-[110px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(15,23,42,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.6) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="container relative mx-auto px-4">
          <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-16">
            {/* Photo side, on the right on desktop, opposite of the last
                "Why Codec Document" row right above it, so the two
                sections don't read as a stacked repeat of the same layout. */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative md:order-2"
            >
              <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-slate-900/15">
                <img
                  src="/images/home/templates-meeting.jpg"
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
                    {language === 'en' ? 'Ready-made templates' : 'Plantillas Prediseñadas'}
                  </span>
                  <p className="text-lg font-black leading-snug text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-xl">
                    {language === 'en' ? 'Contracts ready for any agreement, in minutes' : 'Contratos listos para cualquier acuerdo, en minutos'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="md:order-1"
            >
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
                {language === 'en' ? 'Ready-made templates' : 'Plantillas Prediseñadas'}
              </span>
              <h2
                className="bg-clip-text py-1 text-3xl font-black leading-snug text-transparent md:text-5xl"
                style={{ backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #2563eb 55%, #4f46e5 100%)' }}
              >
                {language === 'en' ? 'A template for every kind of business' : 'Una plantilla para cada tipo de negocio'}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                {language === 'en'
                  ? 'Leases, NDAs, service agreements, vehicle bills of sale and promissory notes, pre-written and ready to fill in, whatever industry you work in.'
                  : 'Arrendamientos, acuerdos de confidencialidad, contratos de servicios, compraventas de vehículos y pagarés, ya redactados y listos para llenar, sin importar tu industria.'}
              </p>
              <button
                type="button"
                onClick={goToTemplatesAfterAuth}
                className="group relative mt-6 inline-flex items-center gap-2.5 overflow-hidden rounded-2xl px-6 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 40%, #1d4ed8 100%)', boxShadow: '0 4px 0 #1e3a8a, 0 8px 24px rgba(29,78,216,0.45)' }}
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {language === 'en' ? 'Browse all templates' : 'Ver todas las plantillas'}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>

          <style>{`
            @keyframes industryScroll {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
          <div
            className="relative mt-16 -mx-4 overflow-hidden px-4"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
            }}
          >
            <div
              className="flex gap-4 py-2"
              style={{ width: 'max-content', animation: 'industryScroll 42s linear infinite' }}
              onMouseEnter={(e) => { e.currentTarget.style.animationPlayState = 'paused'; }}
              onMouseLeave={(e) => { e.currentTarget.style.animationPlayState = 'running'; }}
            >
              {(() => {
                const SECTORS = [
                  { icon: Scale, en: 'Lawyers & Law Firms', es: 'Abogados y Firmas Legales' },
                  { icon: Home, en: 'Real Estate', es: 'Inmobiliarias' },
                  { icon: CreditCard, en: 'Banks & Lenders', es: 'Bancos y Financieras' },
                  { icon: HardHat, en: 'Construction', es: 'Constructores y Contratistas' },
                  { icon: Building2, en: 'Companies', es: 'Empresas' },
                  { icon: Users, en: 'Human Resources', es: 'Recursos Humanos' },
                  { icon: Briefcase, en: 'Freelancers', es: 'Freelancers' },
                  { icon: Calculator, en: 'Accountants', es: 'Contadores' },
                  { icon: MessageCircle, en: 'Consultants', es: 'Consultores' },
                ];
                return [...SECTORS, ...SECTORS].map((s, i) => {
                  const SectorIcon = s.icon;
                  return (
                    <div
                      key={i}
                      className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 py-3 pl-3 pr-5 shadow-sm backdrop-blur-sm"
                    >
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white"
                        style={{ background: 'linear-gradient(180deg, #94a3b8 0%, #475569 50%, #1e293b 100%)', boxShadow: '0 2px 0 #0f172a, 0 4px 10px rgba(15,23,42,0.35)' }}
                      >
                        <SectorIcon className="size-4" />
                      </span>
                      <span className="whitespace-nowrap text-sm font-bold text-slate-700">
                        {language === 'en' ? s.en : s.es}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Custom templates promo, drives signed-in AND anonymous visitors
          toward /my-templates; unauthenticated clicks open the same
          onboarding modal the header's "Get Started Free" button uses,
          instead of a silent bounce back to "/" via ProtectedRoute. */}
      {/* Do more with Codec Document: Smart Quotes / Upload templates /
          Enterprise used to be 3 separate full-bleed sections, each with
          its own mismatched dark gradient. Consolidated into one section
          with 3 horizontal cards on a single, consistent background,
          same functionality (each card's CTA goes to exactly what it did
          before), just visually unified. */}
      <section className="relative overflow-hidden py-16 md:py-28" style={{ background: 'radial-gradient(ellipse 90% 60% at 50% 0%, #0f172a 0%, #1e1b4b 45%, #0f172a 100%)' }}>
        {/* Soft entry blend from the light section above, instead of a
            hard light→dark cut. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 md:h-36" style={{ background: 'linear-gradient(to bottom, rgba(237,233,254,0.9), transparent)' }} />
        {/* Muted looping background video (office footage), the only
            video used on the page, deliberately NOT in the hero per
            instruction. Sits under a dark scrim so the white cards/text
            on top stay fully readable; the radial gradient above is the
            fallback background while the video loads. */}
        <video
          className="pointer-events-none absolute inset-0 size-full object-cover opacity-25"
          src="/videos/office-loop.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(15,23,42,0.75) 0%, rgba(30,27,75,0.85) 45%, rgba(15,23,42,0.92) 100%)' }} />
        {/* Tech-grid texture + ambient glows for a premium, "this platform
            has depth" feel instead of a flat white row of boxes. */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="pointer-events-none absolute left-1/4 top-0 size-[28rem] -translate-y-1/2 rounded-full bg-blue-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute right-1/4 bottom-0 size-[28rem] translate-y-1/2 rounded-full bg-violet-500/20 blur-[100px]" />

        <div className="container relative mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-300">
              <Sparkles className="size-3" /> {language === 'en' ? 'Do more' : 'Haz más'}
            </span>
            <h2
              className="mt-4 bg-clip-text py-1 text-3xl font-black leading-snug text-transparent md:text-4xl"
              style={{ backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 55%, #c4b5fd 100%)' }}
            >
              {language === 'en' ? 'One platform, every workflow' : 'Una plataforma, todos tus flujos'}
            </h2>
          </div>

          <div className="mx-auto grid max-w-6xl gap-7 md:grid-cols-3">
            {[
              {
                icon: Receipt,
                color: '#3b82f6',
                gradient: 'from-blue-500 to-blue-700',
                title: { en: 'Smart Quotes', es: 'Cotizaciones Inteligentes' },
                desc: {
                  en: 'Build a professional quote with live totals and get it accepted with a real electronic signature, a full agreement, not just a PDF.',
                  es: 'Crea una cotización profesional con totales en tiempo real y logra que la acepte con una firma electrónica real, un acuerdo completo, no solo un PDF.',
                },
                bullets: [
                  { en: 'Live totals, quantity, discount and tax as you type', es: 'Totales en vivo, cantidad, descuento e impuesto mientras escribes' },
                  { en: '4 professional designs: Corporate, Modern, Executive, Minimal', es: '4 diseños profesionales: Corporate, Modern, Executive, Minimal' },
                  { en: 'Know when your client opens it, and get it signed online', es: 'Sabe cuándo tu cliente la abre, y logra que la firme en línea' },
                ],
                cta: { en: 'Create my first quote', es: 'Crear mi primera cotización' },
                action: () => (user ? navigate('/my-quotes/new') : setOnboardingOpen(true)),
              },
              {
                icon: FolderOpen,
                color: '#4f46e5',
                gradient: 'from-indigo-500 to-indigo-700',
                title: { en: 'Upload your own templates', es: 'Sube tus propias plantillas' },
                desc: {
                  en: 'Upload any document once, mark where the fields and signature go, and reuse it forever.',
                  es: 'Sube tu propio documento una vez, marca dónde van los campos y la firma, y reúsalo para siempre.',
                },
                bullets: [
                  { en: 'Upload a PDF and mark the fields yourself, no guesswork', es: 'Sube un PDF y marca los campos tú mismo, sin adivinar' },
                  { en: 'Fill it in as many times as you need, it stays saved', es: 'Llénalo las veces que necesites, queda guardado' },
                  { en: 'Your logo, colors and branding, automatically', es: 'Tu logo, colores y marca, de forma automática' },
                ],
                cta: { en: 'Create my first template', es: 'Crear mi primera plantilla' },
                action: () => (user ? navigate('/my-templates') : setOnboardingOpen(true)),
              },
              {
                icon: Building2,
                color: '#8b5cf6',
                gradient: 'from-violet-500 to-violet-700',
                title: { en: 'Enterprise Solutions', es: 'Soluciones para Empresas' },
                desc: {
                  en: 'Automate documents, e-signatures and corporate workflows from a single platform, tailored to your team.',
                  es: 'Automatiza documentos, firmas electrónicas y flujos corporativos desde una sola plataforma, a la medida de tu equipo.',
                },
                bullets: [
                  { en: 'Your company branding on every document', es: 'Tu marca empresarial en cada documento' },
                  { en: 'Role-based permissions for your whole team', es: 'Permisos por rol para todo tu equipo' },
                  { en: 'API & webhooks to connect your own systems', es: 'API y webhooks para conectar tus propios sistemas' },
                ],
                cta: { en: 'Talk to a specialist', es: 'Hablar con un especialista' },
                action: () => setEnterpriseModalOpen(true),
              },
            ].map((card) => {
              const CardIcon = card.icon;
              return (
                <button
                  key={card.title.en}
                  type="button"
                  onClick={card.action}
                  className="group relative flex flex-col rounded-[1.75rem] p-[1px] text-left transition-all duration-300 hover:-translate-y-2"
                  style={{ background: `linear-gradient(145deg, ${card.color}80, ${card.color}10 40%, transparent 70%)` }}
                >
                  <div
                    className="relative flex h-full flex-col overflow-hidden rounded-[1.7rem] bg-slate-900/90 p-7 backdrop-blur-xl transition-shadow duration-300"
                    style={{ boxShadow: `0 20px 50px -20px ${card.color}40, inset 0 1px 0 rgba(255,255,255,0.06)` }}
                  >
                    <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40" style={{ background: card.color }} />

                    <div className={`relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} ring-1 ring-white/20`} style={{ boxShadow: `0 8px 20px -4px ${card.color}70` }}>
                      <CardIcon className="size-7 text-white" />
                    </div>

                    <h3 className="relative mt-5 text-xl font-black text-white">
                      {language === 'en' ? card.title.en : card.title.es}
                    </h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-slate-400">
                      {language === 'en' ? card.desc.en : card.desc.es}
                    </p>

                    <ul className="relative mt-4 space-y-2">
                      {card.bullets.map((b) => (
                        <li key={b.en} className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" style={{ color: card.color }} />
                          {language === 'en' ? b.en : b.es}
                        </li>
                      ))}
                    </ul>

                    <div
                      className={`group/btn relative mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${card.gradient} px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform group-hover:scale-[1.02]`}
                    >
                      {language === 'en' ? card.cta.en : card.cta.es}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      <EnterpriseLeadModal open={enterpriseModalOpen} onOpenChange={setEnterpriseModalOpen} />

      {/* ── Pricing teaser, full plans + checkout now live on their own
          page (/pricing), so a second pricing model has somewhere to go
          later without turning the home page into a second pricing page
          too. PricingSection itself still backs /pricing unchanged. ──── */}
      <section className="relative overflow-hidden bg-white py-16 md:py-20">
        {/* Soft entry blend from the dark section above. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 md:h-36" style={{ background: 'linear-gradient(to bottom, rgba(15,23,42,0.5), transparent)' }} />
        <div className="container relative mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
            {language === 'en' ? 'Pricing' : 'Precios'}
          </span>
          <h2
            className="mx-auto mt-4 max-w-2xl bg-clip-text py-1 text-3xl font-black leading-snug text-transparent md:text-4xl"
            style={{ backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #2563eb 55%, #4f46e5 100%)' }}
          >
            {language === 'en' ? 'Simple, transparent pricing' : 'Precios simples y transparentes'}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            {language === 'en'
              ? 'Start with our Free Plan, 18 documents and 18 signatures per month, no credit card required. Upgrade anytime for unlimited access.'
              : 'Empieza con nuestro Plan Gratuito, 18 documentos y 18 firmas al mes, sin tarjeta de crédito. Actualiza cuando quieras para acceso ilimitado.'}
          </p>
          <Link
            to="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-[0_4px_24px_rgba(79,70,229,0.35)] transition-all hover:-translate-y-0.5"
          >
            {language === 'en' ? 'View plans & pricing' : 'Ver planes y precios'}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 py-16 text-white md:py-28">
        {/* Soft entry blend from the white section above. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 md:h-36" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.55), transparent)' }} />
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.14), transparent)' }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        <div className="container relative mx-auto px-4">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-300">
              {language === 'en' ? 'Verified Reviews' : 'Reseñas Verificadas'}
            </span>
            <h2
              className="mt-3 bg-clip-text py-1 text-3xl font-black leading-snug text-transparent md:text-5xl"
              style={{ backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 55%, #c4b5fd 100%)' }}
            >
              {language === 'en' ? 'Trusted by U.S. Professionals' : 'Confiado por Profesionales en EE. UU.'}
            </h2>
            <p className="mt-3 text-slate-400">
              {language === 'en'
                ? 'Realtors, landlords, and contractors across all 50 states rely on Codec Document.'
                : 'Agentes, propietarios y contratistas en los 50 estados confían en Codec Document.'}
            </p>
          </div>

          {/* Slow infinite scroll instead of a static grid, same
              duplicated-list + CSS keyframe technique used elsewhere on
              this page, paused on hover so a review stays readable. */}
          <style>{`
            @keyframes testimonialScroll {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
          <div
            className="relative -mx-4 overflow-hidden px-4"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
            }}
          >
            <div
              className="flex gap-4 py-2"
              style={{ width: 'max-content', animation: 'testimonialScroll 55s linear infinite' }}
              onMouseEnter={(e) => { e.currentTarget.style.animationPlayState = 'paused'; }}
              onMouseLeave={(e) => { e.currentTarget.style.animationPlayState = 'running'; }}
            >
              {[...premiumTestimonials.slice(0, 6), ...premiumTestimonials.slice(0, 6)].map((item, idx) => (
                <article
                  key={`${item.author}-${idx}`}
                  className="group relative w-[340px] shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-md transition-all hover:border-blue-400/20 hover:bg-white/7 hover:shadow-[0_8px_40px_rgba(59,130,246,0.15)]"
                >
                  <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 ring-1 ring-blue-500/25 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`size-3.5 ${i < item.stars ? 'fill-amber-400 text-amber-400' : 'text-white/15'}`} />
                    ))}
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-white/70">"{item.quote}"</p>
                  <div className="flex items-center gap-3 border-t border-white/8 pt-4">
                    <img src={item.avatar} alt={item.author} className="size-10 rounded-full object-cover ring-2 ring-white/12" loading="lazy" />
                    <div>
                      <p className="text-sm font-bold text-white">{item.author}</p>
                      <p className="text-xs text-white/40">{item.role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Trust numbers */}
          <div className="mt-10 grid grid-cols-2 gap-4 border-t border-white/8 pt-8 sm:grid-cols-4 md:mt-14 md:pt-10">
            {[
              { num: '50K+', labelEn: 'Documents signed', labelEs: 'Documentos firmados' },
              { num: '50', labelEn: 'U.S. states covered', labelEs: 'Estados cubiertos' },
              { num: '99.9%', labelEn: 'Uptime SLA', labelEs: 'Disponibilidad SLA' },
              { num: 'SHA-256', labelEn: 'Cryptographic security', labelEs: 'Seguridad criptográfica' },
            ].map((stat) => (
              <div key={stat.num} className="text-center">
                <p className="text-2xl font-black text-white">{stat.num}</p>
                <p className="mt-1 text-xs text-slate-500">{language === 'en' ? stat.labelEn : stat.labelEs}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── FAQ ── details/summary for native accordion + JSON-LD for Google ── */}
      <section className="relative overflow-hidden bg-slate-50 py-16 md:py-28">
        {/* Soft entry blend from the dark testimonials section above. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 md:h-36" style={{ background: 'linear-gradient(to bottom, rgba(15,23,42,0.45), transparent)' }} />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-14 text-center">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600">FAQ</span>
              <h2
                className="bg-clip-text py-1 text-3xl font-black leading-snug text-transparent md:text-5xl"
                style={{ backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #2563eb 55%, #4f46e5 100%)' }}
              >
                {language === 'en' ? 'Common Questions' : 'Preguntas Frecuentes'}
              </h2>
              <p className="mt-3 text-slate-500">
                {language === 'en'
                  ? 'Everything you need to know about Codec Document.'
                  : 'Todo lo que necesitas saber sobre Codec Document.'}
              </p>
            </div>

            {/* JSON-LD FAQ Schema for Google rich results */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'FAQPage',
                  mainEntity: faqs.map((item) => ({
                    '@type': 'Question',
                    name: item.q,
                    acceptedAnswer: { '@type': 'Answer', text: item.a },
                  })),
                }),
              }}
            />

            <div className="space-y-3">
              {faqs.map((item, i) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow open:shadow-md open:shadow-indigo-100/60"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5 focus:outline-none">
                    <span className="font-bold text-slate-900 pr-4">{item.q}</span>
                    <span className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 transition-all group-open:rotate-45 group-open:border-blue-200 group-open:bg-blue-50 group-open:text-blue-600">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-6 pt-0">
                    <div className="h-px bg-slate-100 mb-4" />
                    <p className="text-sm leading-relaxed text-slate-600">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-8 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 text-center">
              <p className="mb-3 font-bold text-slate-800">
                {language === 'en' ? 'Still have questions?' : '¿Tienes más preguntas?'}
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                <Mail className="size-4" />
                {language === 'en' ? 'Contact Support' : 'Contactar Soporte'}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden bg-slate-950 text-slate-400">
        {/* Pre-footer CTA strip, soft light-blue gradient with diagonal
            ribbon streaks and dark navy text, instead of a flat solid
            blue-to-indigo bar. Same "elegant, techy, trustworthy" feel
            requested for the rest of the page, without copying ZapSign's
            actual assets. */}
        <div
          className="relative overflow-hidden border-b border-white/8 py-14 md:py-20"
          style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #bfdbfe 55%, #60a5fa 100%)' }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 60px, transparent 60px, transparent 150px)' }}
          />
          <div className="pointer-events-none absolute left-1/2 top-0 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 shadow-[0_8px_30px_rgba(37,99,235,0.25)] backdrop-blur-sm">
            <Shield className="size-9 text-blue-600" />
          </div>

          <div className="container relative mx-auto px-4 text-center">
            <h3
              className="mx-auto max-w-2xl bg-clip-text py-1 text-3xl font-black leading-snug text-transparent sm:text-4xl md:text-5xl"
              style={{ backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #2563eb 55%, #4f46e5 100%)' }}
            >
              {language === 'en' ? 'Start closing deals securely, today' : 'Empieza a cerrar negocios de forma segura hoy'}
            </h3>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {[
                language === 'en' ? 'Legally binding signatures' : 'Firma con validez legal',
                language === 'en' ? 'Fast and reliable experience' : 'Experiencia ágil y confiable',
                language === 'en' ? 'Fully customizable' : 'Personaliza la experiencia',
              ].map((feat) => (
                <span key={feat} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="size-4 text-slate-900" />
                  {feat}
                </span>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2">
              <a
                href="/firma-electronica"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-7 py-4 text-sm font-bold text-white shadow-[0_8px_24px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                {language === 'en' ? 'Try free now' : 'Prueba gratis ahora'}
              </a>
              <a
                href="/firma-electronica"
                aria-label={language === 'en' ? 'Try free now' : 'Prueba gratis ahora'}
                className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_8px_24px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <ArrowRight className="size-5 -rotate-45" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer body */}
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="max-w-6xl mx-auto">

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-10 md:gap-10 md:mb-12">

              {/* Col 1: Brand */}
              <div className="lg:col-span-1">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_16px_rgba(99,102,241,0.4)]">
                    <Shield className="size-5 text-white" />
                  </div>
                  <span translate="no" className="notranslate text-base font-black text-white">
                    Codec <span className="text-indigo-400">Document</span>
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-400">
                  {language === 'en'
                    ? 'Free intelligent legal document generator and ESIGN Act compliant e-signature platform for the United States.'
                    : 'Editor inteligente gratuito de documentos legales y plataforma de firma electrónica conforme con ESIGN para EE. UU.'}
                </p>
                <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs italic leading-relaxed text-slate-400">
                    {language === 'en'
                      ? '"So do not fear, for I am with you; do not be dismayed, for I am your God." (Isaiah 41:10)'
                      : '"Así que no temas, porque yo estoy contigo; no te angusties, porque yo soy tu Dios." (Isaías 41:10)'}
                  </p>
                </div>
              </div>

              {/* Col 2: Product */}
              <div>
                <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/50">
                  {language === 'en' ? 'Product' : 'Producto'}
                </h4>
                <ul className="space-y-3 text-sm">
                  <li><button type="button" onClick={() => document.getElementById('documents-section')?.scrollIntoView({ behavior: 'smooth' })} className="transition hover:text-white">{language === 'en' ? 'Templates' : 'Plantillas'}</button></li>
                  <li><a href="/firma-electronica" className="transition hover:text-white">{language === 'en' ? 'E-Signatures' : 'Firmas Electrónicas'}</a></li>
                  <li><a href="/my-documents" className="transition hover:text-white">{language === 'en' ? 'My Documents' : 'Mis Documentos'}</a></li>
                  <li><Link to="/pricing" className="transition hover:text-amber-300 text-amber-400/70">{language === 'en' ? 'Pricing' : 'Precios'}</Link></li>
                  <li><a href="/firma-electronica" className="transition hover:text-white">{language === 'en' ? 'ID Verification' : 'Verificación ID'}</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/50">
                  {language === 'en' ? 'Resources' : 'Recursos'}
                </h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="/free-legal-documents" className="transition hover:text-white">{language === 'en' ? 'Free Legal Docs' : 'Documentos Legales Gratis'}</a></li>
                  <li><a href="/electronic-signature" className="transition hover:text-white">{language === 'en' ? 'E-Signature Platform' : 'Plataforma de Firma Electrónica'}</a></li>
                  <li><a href="/nda-generator" className="transition hover:text-white">{language === 'en' ? 'NDA Generator' : 'Generador de NDA'}</a></li>
                  <li><a href="/online-lease-agreement" className="transition hover:text-white">{language === 'en' ? 'Lease Agreement' : 'Contrato de Arrendamiento'}</a></li>
                  <li><a href="/promissory-note" className="transition hover:text-white">{language === 'en' ? 'Promissory Note' : 'Pagaré Comercial'}</a></li>
                  <li><Link to="/verificar" className="transition hover:text-white">{language === 'en' ? 'Verify a Document' : 'Verificar un Documento'}</Link></li>
                </ul>
              </div>

              {/* Col 3: Legal */}
              <div>
                <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/50">Legal</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="/terms" className="transition hover:text-white">{language === 'en' ? 'Terms of Service' : 'Términos de Servicio'}</a></li>
                  <li><a href="/privacy" className="transition hover:text-white">{language === 'en' ? 'Privacy Policy' : 'Política de Privacidad'}</a></li>
                  <li><a href="/refund-policy" className="transition hover:text-white">{language === 'en' ? 'No Refund Policy' : 'Política Sin Reembolsos'}</a></li>
                  <li>
                    <button
                      type="button"
                      onClick={() => { localStorage.removeItem('codec_cookie_consent_v1'); window.location.reload(); }}
                      className="transition hover:text-white text-left"
                    >
                      {language === 'en' ? 'Cookie Preferences' : 'Preferencias de Cookies'}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Col 4: Compliance */}
              <div>
                <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/50">
                  {language === 'en' ? 'Compliance' : 'Cumplimiento'}
                </h4>
                <div className="space-y-2.5">
                  {[
                    { label: 'ESIGN Act Compliant', sub: '15 U.S.C. § 7001' },
                    { label: 'UETA Compliant', sub: 'All 50 U.S. States' },
                    { label: 'SHA-256 Audit Trail', sub: 'Tamper-evident' },
                    { label: 'SSL / TLS Encrypted', sub: 'End-to-end secure' },
                    { label: 'CCPA & GDPR Ready', sub: 'Privacy-first' },
                  ].map((c) => (
                    <div key={c.label} className="flex items-start gap-2">
                      <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                      <div>
                        <p className="text-xs font-semibold text-slate-300">{c.label}</p>
                        <p className="text-[10px] text-slate-600">{c.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/verificar"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 transition hover:text-indigo-300"
                >
                  <ShieldCheck className="size-3.5" />
                  {language === 'en' ? 'Verify a document' : 'Verificar un documento'} →
                </Link>
              </div>
            </div>

            {/* Direct contact channels, general inquiries + business/sales,
                plus WhatsApp for the LatAm market only (no US number yet). */}
            <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/8 pt-6 text-sm">
              <a href={`mailto:${INFO_EMAIL}`} className="inline-flex items-center gap-2 text-slate-400 transition hover:text-white">
                <Mail className="size-4 text-indigo-400" />
                {INFO_EMAIL}
              </a>
              <a href={`mailto:${BUSINESS_EMAIL}`} className="inline-flex items-center gap-2 text-slate-400 transition hover:text-white">
                <Briefcase className="size-4 text-indigo-400" />
                {BUSINESS_EMAIL}
              </a>
              <a href={MEETING_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-400 transition hover:text-white">
                <CalendarClock className="size-4 text-indigo-400" />
                {language === 'en' ? 'Book a call' : 'Agenda una llamada'}
              </a>
              {language === 'es' && (
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-400 transition hover:text-emerald-400">
                  <MessageCircle className="size-4 text-emerald-500" />
                  WhatsApp
                </a>
              )}
            </div>

            {/* Popular states + LatAm countries, same internal-linking
                rows LandingFooter already shows on every SEO landing page,
                added here too so the home page reads with the same depth
                and trust signal as the rest of the site. */}
            <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">{language === 'en' ? 'Popular states:' : 'Estados populares:'}</span>
              {STATES.map((s, i, arr) => (
                <span key={s.slug}>
                  <a href={`/legal-documents-${s.slug}`} className="transition hover:text-white">{language === 'en' ? s.name : s.nameEs}</a>
                  {i < arr.length - 1 && <span className="text-slate-700">,</span>}
                </span>
              ))}
            </div>
            <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">{language === 'en' ? 'Also in Latin America:' : 'También en Latinoamérica:'}</span>
              {LATAM_COUNTRIES.map((c) => (
                <a
                  key={c.slug}
                  href={`/firma-electronica-${c.slug}`}
                  className="inline-flex items-center gap-1 transition hover:text-white"
                >
                  <span>{c.flag}</span>
                  {language === 'en' ? c.name : c.nameEs}
                </a>
              ))}
            </div>

            {/* Manual market preview, lets anyone (not just a visitor whose
                real IP happens to geolocate to the other market) see the
                other home experience on demand, via the ?market= override
                above. */}
            <div className="mb-6 text-xs text-slate-500">
              {effectiveIsLatam ? (
                <a href="/?market=us" className="inline-flex items-center gap-1.5 font-semibold text-slate-400 transition hover:text-white">
                  🇺🇸 {language === 'en' ? 'Viewing the LatAm experience, see the US version' : 'Viendo la experiencia LatAm, ver la versión para Estados Unidos'}
                </a>
              ) : (
                <a href="/?market=latam" className="inline-flex items-center gap-1.5 font-semibold text-slate-400 transition hover:text-white">
                  🌎 {language === 'en' ? 'Viewing the US experience, see the Latin America version' : 'Viendo la experiencia de EE. UU., ver la versión para Latinoamérica'}
                </a>
              )}
            </div>

            {/* Bottom strip */}
            <div className="flex flex-col items-center gap-3 border-t border-white/8 pt-8 text-center text-xs sm:flex-row sm:justify-between">
              <p className="text-slate-600">
                © {new Date().getFullYear()} <span translate="no" className="notranslate">Codec Document</span>.{' '}
                {language === 'en' ? 'All rights reserved.' : 'Todos los derechos reservados.'}
              </p>
              <p className="text-slate-600">
                {language === 'en' ? 'Made with' : 'Hecho con'} ❤️ {language === 'en' ? 'by' : 'por'}{' '}
                <a href="https://codecstudio.online/" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  <span translate="no" className="notranslate">Codec Studio</span>
                </a>
              </p>
              <p className="max-w-xs text-slate-700">
                {language === 'en'
                  ? 'Documents are for informational purposes only and do not constitute legal advice.'
                  : 'Los documentos son solo informativos y no constituyen asesoramiento legal.'}
              </p>
            </div>
          </div>
        </div>
      </footer>


      {/* ── Floating Action Buttons, this page is desktop-only now, mobile
          always redirects into the /app bottom-nav shell above. ────────── */}
      <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-3">

        {/* FAB: Verificar un documento, stacked just above WhatsApp
            (WhatsApp stays the primary, bottom-most FAB). Links straight
            to the public authenticity verifier built earlier. */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="group flex items-center gap-2"
        >
          <span className="rounded-xl border border-white/10 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-xl transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100">
            {language === 'en' ? 'Verify a document' : 'Verificar documento'}
          </span>
          <Link
            to="/verificar"
            className="flex size-12 items-center justify-center rounded-2xl text-white shadow-xl shadow-black/40 transition-all duration-200 hover:scale-110"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)' }}
          >
            <ShieldCheck className="size-5" />
          </Link>
        </motion.div>

        {/* FAB 3: WhatsApp, LatAm only, no US number yet */}
        {language === 'es' && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="group flex items-center gap-2"
          >
            <span className="rounded-xl border border-white/10 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-xl transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100">
              WhatsApp
            </span>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-12 items-center justify-center rounded-2xl text-white shadow-xl shadow-black/40 transition-all duration-200 hover:scale-110"
              style={{ background: '#25D366' }}
            >
              <MessageCircle className="size-5" />
            </a>
          </motion.div>
        )}
      </div>

      <OnboardingModal
        open={onboardingOpen}
        onOpenChange={(v) => { setOnboardingOpen(v); if (!v) setOnboardingContext(undefined); }}
        contextMessage={onboardingContext}
      />

      {/* Info popup, explains whichever security feature or compliance/law
          badge was clicked. Image-forward (big icon), 1-2 short sentences,
          no wall of text, per explicit feedback on the Platform menu. */}
      <AnimatePresence>
        {infoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onClick={() => setInfoModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-8 text-center shadow-[0_30px_70px_rgba(15,23,42,0.35)]"
            >
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                aria-label="Close"
                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
              <div
                className="mx-auto mb-5 flex size-20 items-center justify-center rounded-3xl text-white"
                style={{ background: `linear-gradient(145deg, ${infoModal.color}, ${infoModal.color}cc)`, boxShadow: `0 10px 30px -6px ${infoModal.color}88` }}
              >
                <infoModal.icon className="size-10" />
              </div>
              <h3 className="text-lg font-black text-slate-900">{infoModal.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-500">{infoModal.desc}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
