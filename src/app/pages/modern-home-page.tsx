import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Star, QrCode, FileText, BadgeCheck, User, ChevronDown, FolderOpen, PenLine, LogOut, Settings, Camera, Download, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { documentTemplates } from '../data/templates';
import { useLanguage } from '../contexts/language-context';
import { LanguageToggle } from '../components/language-toggle';
import { SEOHead } from '../components/seo-head';
import { StructuredData } from '../components/structured-data';
import { ModernHero } from '../components/modern-hero';
import { ComparisonTable } from '../components/comparison-table';
import { DocumentBentoGrid } from '../components/document-bento-grid';
import { PricingSection } from '../components/pricing-section';
import { useAuth } from '../contexts/auth-context';
import { getDocumentTemplate, getPilotStateDocumentCombos, getStateBySlug } from '../utils/seo';
import { toast } from 'sonner';
import { createSignatureRequest, getSignaturePricingStatus, getSignatureRequestStatus } from '../services/paypal-service';
import { QRCodeSVG } from 'qrcode.react';
import * as pdfjsLib from 'pdfjs-dist';
import { OnboardingModal } from '../components/auth/OnboardingModal';

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
  const [filteredDocuments] = useState(documentTemplates);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDocumentsMenu, setShowDocumentsMenu] = useState(false);
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pilotLandingLinks = useMemo(
    () => getPilotStateDocumentCombos()
      .map((combo) => {
        const document = getDocumentTemplate(combo.documentType);
        const stateName = getStateBySlug(combo.stateSlug);
        if (!document || !stateName) return null;
        return {
          label: `${document.name} in ${stateName}`,
          to: `/landing/${combo.documentType}/${combo.stateSlug}`,
        };
      })
      .filter((item): item is { label: string; to: string } => Boolean(item)),
    [],
  );

  const seoLandingLinks = useMemo(
    () => [
      {
        label: language === 'en' ? 'Free Legal Documents' : 'Documentos legales gratis',
        to: '/free-legal-documents',
        description: language === 'en'
          ? 'State-specific templates, free e-signatures, and instant PDF generation.'
          : 'Plantillas por estado, firmas electrónicas gratis y generación inmediata de PDF.',
      },
      {
        label: language === 'en' ? 'Electronic Signature Platform' : 'Plataforma de firma electrónica',
        to: '/electronic-signature',
        description: language === 'en'
          ? 'Learn how to sign documents online with ESIGN Act compliance and identity verification.'
          : 'Aprende a firmar documentos en línea con cumplimiento ESIGN y verificación de identidad.',
      },
      {
        label: language === 'en' ? 'NDA Generator' : 'Generador de NDA',
        to: '/nda-generator',
        description: language === 'en'
          ? 'Generate non-disclosure agreements with audit-ready signature workflows.'
          : 'Genera acuerdos de confidencialidad con flujos de firma listos para auditoría.',
      },
      {
        label: language === 'en' ? 'Lease Agreement Generator' : 'Generador de contrato de arrendamiento',
        to: '/online-lease-agreement',
        description: language === 'en'
          ? 'Create rental contracts tailored to your state and sign them electronically.'
          : 'Crea contratos de alquiler adaptados a tu estado y fírmalo electrónicamente.',
      },
      {
        label: language === 'en' ? 'Independent Contractor Agreement' : 'Contrato de contratista independiente',
        to: '/independent-contractor-agreement',
        description: language === 'en'
          ? 'Draft contractor agreements quickly and collect verified e-signatures online.'
          : 'Redacta acuerdos de contratista rápidamente y recibe firmas electrónicas verificadas.',
      },
      {
        label: language === 'en' ? 'Promissory Note' : 'Pagaré comercial',
        to: '/promissory-note',
        description: language === 'en'
          ? 'Generate payment promissory notes with secure signature and audit trail support.'
          : 'Genera pagarés con firma segura y soporte de auditoría.',
      },
    ],
    [language],
  );

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
      quote: "Best DocuSign alternative I've found. Full template editor, not just a PDF uploader — and it's free to start.",
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
          a: 'Yes. You get 1 structured intelligent document every 72 hours and 1 free ESIGN-compliant digital signature per day — no credit card required. Unlike platforms that only let you sign flat PDFs you upload from elsewhere, Codec Document builds NDA, lease agreements, and service contracts from scratch for free. Premium plans unlock unlimited documents, co-signer QR links, identity verification, and priority support.'
        },
        {
          q: 'How does Codec Document compare to DocuSign or PandaDoc?',
          a: 'Codec Document gives you a free intelligent template editor — not just a flat PDF signer. You build professional legal documents from scratch, customize every field, apply your logo, and e-sign with ESIGN Act compliance. Plus, our native selfie + ID biometric verification creates an embedded audit trail that traditional platforms charge extra for. Premium plans start at $79.99/month.'
        },
        {
          q: 'Are e-signatures legally valid in the USA?',
          a: 'Yes. All signatures on Codec Document are fully compliant with the US Federal ESIGN Act (15 U.S.C. § 7001) and UETA (Uniform Electronic Transactions Act). Every document receives a SHA-256 cryptographic fingerprint, IP logging, timestamp, and an immutable audit trail — making them court-admissible in all 50 states.'
        },
        {
          q: 'Are these documents valid in all 50 U.S. states?',
          a: 'Our templates include state-specific legal clauses for all 50 US states including California, Texas, Florida, New York, Illinois, and more. The documents automatically adapt compliance notices based on the selected state. For complex transactions or litigation-critical agreements, we recommend reviewing with a licensed attorney.'
        },
        {
          q: 'What is identity verification and how does it work?',
          a: 'After signing, you can optionally capture a live selfie and a photo of your government ID directly through the browser. These images are embedded as a biometric audit block directly inside the signed PDF — no external app required. This adds an additional layer of identity assurance beyond the digital signature itself.'
        },
        {
          q: 'Can I preview the full document before paying?',
          a: 'Yes. Fill out the complete form and preview the entire document with watermark before any payment. Free users download 1 clean watermark-free copy per 72h; premium users get unlimited downloads with no watermark, plus co-signer invite links, custom branding, and the biometric identity audit block.'
        },
        {
          q: 'What is the SHA-256 audit trail?',
          a: 'Every signed document receives a SHA-256 cryptographic hash — a unique fingerprint proving the document has not been altered since the moment of signing. This creates a tamper-evident, court-admissible record satisfying both the ESIGN Act and UETA requirements. The hash is embedded in the document footer and included in the audit certificate page.'
        },
      ]
    : [
        {
          q: '¿Codec Document es gratis?',
          a: 'Sí. Obtienes 1 documento inteligente estructurado cada 72 horas y 1 firma digital gratuita al día, sin tarjeta de crédito. A diferencia de plataformas que solo permiten firmar PDFs subidos, el editor de Codec Document construye NDAs, contratos de arrendamiento y acuerdos de servicios desde cero, de forma gratuita. Los planes premium desbloquean documentos ilimitados, QR de co-firmantes y verificación de identidad.'
        },
        {
          q: '¿Cómo se compara con DocuSign o PandaDoc?',
          a: 'Codec Document ofrece un editor inteligente gratuito de plantillas legales, no solo un firmador de PDFs planos. Puedes construir documentos profesionales desde cero, personalizarlos, aplicar tu logo y firmarlos con conformidad ESIGN. Además, la verificación biométrica nativa con selfie + documento de identidad crea un bloque de auditoría embebido que las plataformas tradicionales cobran aparte. Planes premium desde $79.99/mes.'
        },
        {
          q: '¿Las firmas electrónicas son legalmente válidas en EE. UU.?',
          a: 'Sí. Todas las firmas son conformes con la Ley Federal ESIGN (15 U.S.C. § 7001) y la UETA. Cada documento recibe un hash SHA-256, registro de IP, marca de tiempo biométrica y pista de auditoría inmutable — admisibles en tribunales de los 50 estados.'
        },
        {
          q: '¿Estos documentos son válidos en todos los estados de EE. UU.?',
          a: 'Las plantillas incluyen cláusulas legales específicas por estado para los 50 estados de EE. UU., incluyendo California, Texas, Florida y Nueva York. Los documentos adaptan automáticamente los avisos de cumplimiento según el estado seleccionado. Para transacciones complejas, recomendamos revisar con un abogado licenciado.'
        },
        {
          q: '¿Qué es la verificación de identidad biométrica?',
          a: 'Después de firmar, puedes capturar una selfie en vivo y una foto de tu documento de identidad directamente desde el navegador. Estas imágenes se embeben como un bloque de auditoría biométrica dentro del PDF firmado — sin necesidad de app externa. Esto añade una capa adicional de seguridad más allá de la firma digital.'
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
              ? `Error de configuración Google: el Client ID en Supabase no coincide. Verifica Supabase > Auth > Providers > Google (ID: ${clientId?.slice(0, 20)}…)`
              : raw || (language === 'en' ? 'Google login failed' : 'Falló el login con Google');
            setGoogleError(message);
            toast.error(message);
          }
        },
      });

      googleInitializedRef.current = true;
      setGoogleError(null);
      setGoogleReady(true);

      // One Tap — floating card appears automatically if user has active Google session
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

  return (
    <div className="min-h-screen bg-white" style={{ scrollBehavior: 'smooth' }}>
      <SEOHead
        title={language === 'en'
          ? 'Codec Document — Free Legal Documents & E-Signatures | ESIGN Act Compliant'
          : 'Codec Document — Documentos Legales Gratis y Firma Electrónica | Conforme ESIGN'}
        description={language === 'en'
          ? 'Generate, customize, and e-sign legal documents for free. NDA, residential lease agreements, service contracts for all 50 US states. Free intelligent editor + 1 free e-signature/day. No credit card required. ESIGN Act & UETA compliant, SHA-256 audit trail.'
          : 'Genera, personaliza y firma digitalmente documentos legales gratis. NDA, contratos de arrendamiento, acuerdos de servicios para los 50 estados de EE. UU. Editor inteligente gratuito + 1 firma gratis al día. Sin tarjeta de crédito. Conforme ESIGN y UETA.'}
        keywords={language === 'en'
          ? 'free legal documents online, free electronic signature, free NDA template, free lease agreement USA, free contract generator, esign act compliant, ueta compliant, digital signature free, legal document generator, online document signing, free business contract, independent contractor agreement free, free service agreement, document signing without credit card, pandadoc alternative free, docusign alternative free'
          : 'documentos legales gratis, firma electrónica gratis, plantilla NDA gratis, contrato arrendamiento gratis USA, generador contrato gratis, conforme esign act, firma digital gratis, generador documentos legales, firma documentos online gratis'}
        canonicalUrl={typeof window !== 'undefined' ? window.location.origin : 'https://codecdocument.com'}
      />
      <StructuredData />

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <header
        className={[
          'sticky top-0 z-50 transition-all duration-500',
          scrolled
            ? 'border-b border-white/8 bg-slate-950/90 shadow-[0_4px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl'
            : 'border-b border-transparent bg-slate-950',
        ].join(' ')}
      >
        {/* Top accent line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">

            {/* ── Logo ───────────────────────────────────────────────────── */}
            <a href="/" className="group flex items-center gap-2.5">
              <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-shadow duration-300 group-hover:shadow-[0_0_28px_rgba(99,102,241,0.7)]">
                <Shield className="size-5 text-white" />
                <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
              </div>
              <div>
                <span className="block text-base font-black tracking-tight text-white">
                  Codec <span className="text-indigo-400">Document</span>
                </span>
                <span className="block text-[10px] font-medium text-white/35 leading-none">
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
                  className="group flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-white/60 transition-all hover:bg-white/8 hover:text-white"
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
                      className="absolute left-0 mt-1 w-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl"
                    >
                      <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                        {language === 'en' ? 'Catalog' : 'Catálogo'}
                      </p>
                      <ul className="max-h-64 space-y-0.5 overflow-auto">
                        {featuredDocuments.map((doc) => (
                          <li key={doc.id}>
                            <button
                              type="button"
                              className="w-full rounded-xl px-3 py-2 text-left text-sm text-white/70 transition hover:bg-white/8 hover:text-white"
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

              <Link
                to="/free-legal-documents"
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-white/60 transition hover:bg-white/8 hover:text-white"
              >
                <FileText className="size-4" />
                {language === 'en' ? 'Free Docs' : 'Documentos gratis'}
              </Link>

              <a
                href="/firma-electronica"
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-white/60 transition hover:bg-white/8 hover:text-white"
              >
                <QrCode className="size-4" />
                {language === 'en' ? 'Signatures' : 'Firmas'}
              </a>

              {/* Plans */}
              <button
                type="button"
                onClick={() => document.getElementById('plan-ultimate')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-amber-400/80 transition hover:bg-amber-400/10 hover:text-amber-300"
              >
                {language === 'en' ? 'Plans' : 'Planes'}
              </button>
            </nav>

            {/* ── Right actions ─────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
              {/* Signature CTA */}
              <a
                href="/firma-electronica"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-[0_0_16px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_0_24px_rgba(99,102,241,0.6)]"
              >
                <PenLine className="size-3.5" />
                {language === 'en' ? 'Sign now' : 'Firmar ahora'}
              </a>

              {/* Google login OR user avatar */}
              {!user ? (
                <button
                  type="button"
                  onClick={() => setOnboardingOpen(true)}
                  className="group relative hidden sm:inline-flex items-center gap-2 overflow-hidden rounded-xl border border-blue-400/25 px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_#1e3a8a,0_6px_20px_rgba(29,78,216,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_#1e3a8a,0_8px_28px_rgba(29,78,216,0.55)] active:translate-y-0 active:shadow-[0_2px_0_#1e3a8a]"
                  style={{ background: 'linear-gradient(180deg, #4f9af8 0%, #2563eb 40%, #1d4ed8 100%)' }}
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/18 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {language === 'en' ? 'Get Started' : 'Comenzar'}
                </button>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu((prev) => !prev)}
                    className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/6 pl-1 pr-3 py-1 transition hover:border-white/20 hover:bg-white/10"
                  >
                    {user.picture ? (
                      <img src={user.picture} alt="Perfil" className="size-7 rounded-xl object-cover ring-1 ring-white/20" />
                    ) : (
                      <span className="flex size-7 items-center justify-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-400/20">
                        <User className="size-3.5 text-indigo-300" />
                      </span>
                    )}
                    <span className="hidden max-w-[120px] truncate text-xs font-semibold text-white/80 sm:block">
                      {user.name || user.email}
                    </span>
                    <ChevronDown className={`size-3.5 text-white/40 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl"
                      >
                        {/* User info */}
                        <div className="mb-1.5 border-b border-white/8 px-3 pb-2 pt-1">
                          <p className="text-xs font-bold text-white">{user.name || 'Usuario'}</p>
                          <p className="truncate text-[10px] text-white/40">{user.email}</p>
                        </div>
                        {[
                          { icon: FileText, label: language === 'en' ? 'My Documents' : 'Mis documentos', action: () => { navigate('/my-documents'); setShowUserMenu(false); } },
                          { icon: Settings, label: language === 'en' ? 'My Subscription' : 'Mi Suscripción', action: () => { setShowUserMenu(false); document.getElementById('plan-ultimate')?.scrollIntoView({ behavior: 'smooth' }); } },
                        ].map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <button
                              key={item.label}
                              type="button"
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/8 hover:text-white"
                              onClick={item.action}
                            >
                              <ItemIcon className="size-4 text-white/40" />
                              {item.label}
                            </button>
                          );
                        })}
                        <div className="mt-1 border-t border-white/8 pt-1">
                          <button
                            type="button"
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-400/80 transition hover:bg-red-500/10 hover:text-red-400"
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

              {/* Hamburger — mobile only */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((p) => !p)}
                aria-label="Menu"
                className="md:hidden flex size-9 items-center justify-center rounded-xl border border-white/12 bg-white/6 text-white/70 transition hover:bg-white/12 hover:text-white"
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
              className="overflow-hidden border-t border-white/8 bg-slate-950/98 md:hidden backdrop-blur-xl"
            >
              <div className="container mx-auto px-4 py-4 space-y-1">
                {/* Templates */}
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); document.getElementById('documents-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/8 hover:text-white"
                >
                  <FolderOpen className="size-4 text-blue-400" />
                  {language === 'en' ? 'Templates' : 'Plantillas'}
                </button>
                {/* Signatures */}
                <a
                  href="/firma-electronica"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/8 hover:text-white"
                >
                  <QrCode className="size-4 text-indigo-400" />
                  {language === 'en' ? 'E-Signatures' : 'Firmas Electrónicas'}
                </a>
                {/* Plans */}
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); document.getElementById('plan-ultimate')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-amber-400/80 transition hover:bg-amber-400/10 hover:text-amber-300"
                >
                  <Star className="size-4" />
                  {language === 'en' ? 'Plans & Pricing' : 'Planes y Precios'}
                </button>

                {user ? (
                  <>
                    <div className="my-2 h-px bg-white/8" />
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); navigate('/my-documents'); }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/8 hover:text-white"
                    >
                      <FileText className="size-4 text-white/40" />
                      {language === 'en' ? 'My Documents' : 'Mis Documentos'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); logout(); }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400/80 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <LogOut className="size-4" />
                      {language === 'en' ? 'Sign out' : 'Cerrar sesión'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="my-2 h-px bg-white/8" />
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); setOnboardingOpen(true); }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all"
                      style={{ background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 40%, #1d4ed8 100%)', boxShadow: '0 4px 0 #1e3a8a' }}
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

      {/* Hero Section */}
      <ModernHero />

      <section className="bg-slate-950 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl text-center">
            <span className="inline-flex rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
              {language === 'en' ? 'SEO Landing Pages' : 'Páginas de destino SEO'}
            </span>
            <h2 className="mt-6 text-3xl font-bold text-white">
              {language === 'en'
                ? 'Explore our page flows for documents and signing'
                : 'Explora nuestras páginas de destino para documentos y firmas'}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              {language === 'en'
                ? 'Browse the most optimized landing pages for document creation, e-signature workflows, and legal contract generation.'
                : 'Explora las páginas más optimizadas para creación de documentos, flujos de firma electrónica y generación de contratos legales.'}
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {seoLandingLinks.map((landing) => (
              <Link
                key={landing.to}
                to={landing.to}
                className="rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-left text-white transition hover:-translate-y-0.5 hover:border-sky-400/30 hover:bg-slate-800"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
                  {landing.label}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{landing.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Elige tu Documento */}
      <section id="documents-section">
        <DocumentBentoGrid documents={filteredDocuments} />
      </section>

      {/* Popular state-specific SEO pages */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-600">
              {language === 'en' ? 'Pilot pages' : 'Páginas piloto'}
            </span>
            <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
              {language === 'en' ? 'Top state-specific legal templates' : 'Plantillas legales por estado más buscadas'}
            </h2>
            <p className="mt-3 text-base text-slate-500 md:text-lg">
              {language === 'en'
                ? 'Explore the legal templates we are optimizing for organic traffic in the United States.'
                : 'Explora las plantillas legales que estamos optimizando para tráfico orgánico en Estados Unidos.'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pilotLandingLinks.map((landing) => (
              <Link
                key={landing.to}
                to={landing.to}
                className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-lg"
              >
                <p className="text-sm font-semibold text-indigo-700">{language === 'en' ? 'Popular Search' : 'Búsqueda popular'}</p>
                <h3 className="mt-3 text-xl font-bold text-slate-900">{landing.label}</h3>
                <p className="mt-4 text-sm text-slate-600">{language === 'en' ? 'Create, sign, and download a state-specific legal form.' : 'Crea, firma y descarga una forma legal específica por estado.'}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                  {language === 'en' ? 'Launch page' : 'Abrir página'}
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Comparativa de IA Mejorada */}
      <ComparisonTable />

      {/* How It Works — 4 steps matching the app flow */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40 py-16 md:py-28">
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
                {language === 'en' ? 'Simple Process' : 'Proceso Simple'}
              </span>
              <h2 className="text-3xl font-black text-slate-900 md:text-5xl">
                {language === 'en' ? 'Ready in 4 Steps' : 'Listo en 4 Pasos'}
              </h2>
              <p className="mt-3 text-base text-slate-500 max-w-2xl mx-auto md:text-lg">
                {language === 'en'
                  ? 'From blank form to legally binding signed document — in under 5 minutes.'
                  : 'Del formulario en blanco al documento firmado con validez legal — en menos de 5 minutos.'}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
              {[
                {
                  step: '01',
                  icon: FileText,
                  colorClass: 'from-blue-500 to-indigo-600',
                  bgClass: 'bg-blue-50',
                  borderClass: 'border-blue-100',
                  titleEn: 'Fill the Form',
                  titleEs: 'Llena el Formulario',
                  descEn: "Select your template and fill in the parties' details. Get a real-time preview of your legal document.",
                  descEs: 'Selecciona la plantilla y completa los datos de las partes. Previsualización en tiempo real.',
                },
                {
                  step: '02',
                  icon: PenLine,
                  colorClass: 'from-indigo-500 to-violet-600',
                  bgClass: 'bg-indigo-50',
                  borderClass: 'border-indigo-100',
                  titleEn: 'Sign Digitally',
                  titleEs: 'Firma Digitalmente',
                  descEn: 'Draw your e-signature or send a unique QR link to co-signers. Sign from any device, anywhere.',
                  descEs: 'Dibuja tu firma electrónica o envía un enlace QR único a co-firmantes. Desde cualquier dispositivo.',
                },
                {
                  step: '03',
                  icon: Camera,
                  colorClass: 'from-violet-500 to-purple-600',
                  bgClass: 'bg-violet-50',
                  borderClass: 'border-violet-100',
                  titleEn: 'Verify Identity',
                  titleEs: 'Verifica Identidad',
                  descEn: 'Capture a live selfie + ID photo. Biometric proof is embedded directly inside your signed PDF.',
                  descEs: 'Captura selfie + foto de ID. La prueba biométrica queda embebida dentro del PDF firmado.',
                },
                {
                  step: '04',
                  icon: Download,
                  colorClass: 'from-emerald-500 to-teal-600',
                  bgClass: 'bg-emerald-50',
                  borderClass: 'border-emerald-100',
                  titleEn: 'Download PDF',
                  titleEs: 'Descarga el PDF',
                  descEn: 'Receive a clean, watermark-free PDF with SHA-256 audit trail — court-admissible in all 50 states.',
                  descEs: 'Recibe un PDF limpio con pista de auditoría SHA-256 — admisible en tribunales de los 50 estados.',
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
                    className={['relative border-2 rounded-2xl p-5 pt-9 md:rounded-3xl md:p-7 md:pt-10 transition-all hover:-translate-y-1 hover:shadow-xl', s.bgClass, s.borderClass].join(' ')}
                  >
                    {/* Step badge */}
                    <div className={['absolute -top-5 left-6 flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-black text-white shadow-lg', s.colorClass].join(' ')}>
                      {s.step}
                    </div>
                    {/* Connector dashes between steps */}
                    {idx < 3 && (
                      <div className="absolute -right-3 top-1/2 z-10 hidden h-px w-6 -translate-y-1/2 border-t-2 border-dashed border-slate-300 lg:block" />
                    )}
                    <StepIcon className="mb-4 size-7 text-slate-700" />
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


      <PricingSection />

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 py-16 text-white md:py-28">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.14), transparent)' }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        <div className="container relative mx-auto px-4">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-300">
              {language === 'en' ? 'Verified Reviews' : 'Reseñas Verificadas'}
            </span>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">
              {language === 'en' ? 'Trusted by U.S. Professionals' : 'Confiado por Profesionales en EE. UU.'}
            </h2>
            <p className="mt-3 text-slate-400">
              {language === 'en'
                ? 'Realtors, landlords, and contractors across all 50 states rely on Codec Document.'
                : 'Agentes, propietarios y contratistas en los 50 estados confían en Codec Document.'}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {premiumTestimonials.slice(0, 6).map((item, idx) => (
              <motion.article
                key={`${item.author}-${idx}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-md transition-all hover:border-blue-400/20 hover:bg-white/7 hover:shadow-[0_8px_40px_rgba(59,130,246,0.15)]"
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
              </motion.article>
            ))}
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
      <section className="relative bg-slate-50 py-16 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-14 text-center">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600">FAQ</span>
              <h2 className="text-3xl font-black text-slate-900 md:text-5xl">
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
                href="mailto:support@codecdocument.com"
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
        {/* Pre-footer CTA strip */}
        <div className="border-b border-white/8 bg-gradient-to-r from-blue-600 to-indigo-600 py-8 md:py-10">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-xl font-black text-white sm:text-2xl md:text-3xl">
              {language === 'en' ? 'Ready to sign your first document?' : '¿Listo para firmar tu primer documento?'}
            </h3>
            <p className="mt-2 text-blue-100">
              {language === 'en'
                ? 'Create your free account in 30 seconds. No credit card required.'
                : 'Crea tu cuenta gratis en 30 segundos. Sin tarjeta de crédito.'}
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="/firma-electronica"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <CheckCircle2 className="size-4" />
                {language === 'en' ? 'Get Started Free' : 'Empezar Gratis'}
              </a>
              <button
                type="button"
                onClick={() => document.getElementById('plan-ultimate')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                {language === 'en' ? 'View Plans' : 'Ver Planes'}
              </button>
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
                  <span className="text-base font-black text-white">
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
                      ? '"So do not fear, for I am with you; do not be dismayed, for I am your God." — Isaiah 41:10'
                      : '"Así que no temas, porque yo estoy contigo; no te angusties, porque yo soy tu Dios." — Isaías 41:10'}
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
                  <li><button type="button" onClick={() => document.getElementById('plan-ultimate')?.scrollIntoView({ behavior: 'smooth' })} className="transition hover:text-amber-300 text-amber-400/70">{language === 'en' ? 'Pricing' : 'Precios'}</button></li>
                  <li><a href="/firma-electronica" className="transition hover:text-white">{language === 'en' ? 'ID Verification' : 'Verificación ID'}</a></li>
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
              </div>
            </div>

            {/* Bottom strip */}
            <div className="flex flex-col items-center gap-3 border-t border-white/8 pt-8 text-center text-xs sm:flex-row sm:justify-between">
              <p className="text-slate-600">
                © {new Date().getFullYear()} Codec Document.{' '}
                {language === 'en' ? 'All rights reserved.' : 'Todos los derechos reservados.'}
              </p>
              <p className="text-slate-600">
                {language === 'en' ? 'Made with' : 'Hecho con'} ❤️ {language === 'en' ? 'by' : 'por'}{' '}
                <a href="https://codecstudio.online/" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  Codec Studio
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


      {/* ── Floating Action Buttons ──────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-3">

        {/* FAB 2: Browse templates */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="group flex items-center gap-2"
        >
          {/* Label — visible on hover (desktop) / always on mobile */}
          <span className="rounded-xl border border-white/10 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-xl transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100">
            {language === 'en' ? 'Create legal doc' : 'Crear documento'}
          </span>
          <button
            type="button"
            onClick={() => document.getElementById('documents-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-slate-900/80 text-white shadow-xl shadow-black/40 backdrop-blur-xl transition-all duration-200 hover:scale-110 hover:border-indigo-400/40 hover:shadow-[0_0_24px_rgba(99,102,241,0.35)]"
          >
            <FileText className="size-5" />
          </button>
        </motion.div>

        {/* FAB 1: Sign now — primary, with pulse ring */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="group flex items-center gap-2"
        >
          <span className="rounded-xl border border-indigo-400/20 bg-indigo-950/90 px-3 py-1.5 text-xs font-bold text-indigo-200 shadow-lg backdrop-blur-xl transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100">
            {language === 'en' ? '✍️ Sign here' : '✍️ Firma aquí'}
          </span>

          <a href="/firma-electronica" className="relative flex">
            {/* Pulse ring */}
            <span className="absolute inset-0 animate-ping rounded-2xl bg-indigo-500/30" />
            <span className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[0_0_28px_rgba(99,102,241,0.6)] ring-1 ring-white/20 transition-all duration-200 hover:scale-110 hover:shadow-[0_0_48px_rgba(99,102,241,0.8)]">
              <BadgeCheck className="size-6" />
            </span>
          </a>
        </motion.div>
      </div>

      <OnboardingModal open={onboardingOpen} onOpenChange={setOnboardingOpen} />
    </div>
  );
}
