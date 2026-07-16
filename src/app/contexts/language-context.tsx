import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Header
    'header.title': 'Document Center',
    'header.subtitle': 'Professional Legal Documents',
    
    // Hero
    'hero.title': 'Professional Legal Documents in Minutes',
    'hero.subtitle': 'Generate attorney-drafted legal documents instantly. Pay only $4-$10 per document instead of hundreds in legal fees. Preview for free with watermarks, purchase to download.',
    'hero.cta': 'Browse Documents',
    'hero.feature1': 'Free Preview',
    'hero.feature2': 'Instant Download',
    'hero.feature3': 'Professional Quality',
    'hero.feature4': 'Complete Control',
    
    // Document Generator Page
    'generator.backToTemplates': 'Back to Templates',
    'generator.step': 'Step',
    'generator.of': 'of',
    'generator.complete': 'Complete',
    'generator.documentInfo': 'Document Information',
    'generator.fillRequired': 'Fill in the required information. All fields marked with * are required.',
    'generator.previous': 'Previous',
    'generator.next': 'Next',
    'generator.previewDocument': 'Preview Document',
    'generator.fillAllFields': 'Please fill in all required fields',
    'generator.selectOption': 'Select an option',
    'generator.templateNotFound': 'Template not found',
    'generator.phonePlaceholder': 'e.g., (555) 123-4567',
    
    // Preview Page
    'preview.backToForm': 'Back to Form',
    'preview.purchased': 'Purchased',
    'preview.previewMode': 'Preview Mode',
    'preview.previewModeDesc': 'This is a watermarked preview. Purchase to unlock full editing and download capabilities.',
    'preview.documentPreview': 'Document Preview',
    'preview.edit': 'Edit',
    'preview.saveEdits': 'Save Edits',
    'preview.download': 'Download',
    'preview.editDirectly': 'Edit the document directly below',
    'preview.scrollReview': 'Scroll to review your document',
    'preview.changesSaved': 'Changes saved to preview',
    'preview.readyToDownload': 'Ready to Download?',
    'preview.purchaseToUnlock': 'Purchase to unlock the full document without watermarks',
    'preview.oneTime': 'one-time',
    'preview.professionalGrade': 'Professional Grade',
    'preview.professionalGradeDesc': 'Attorney-drafted with all necessary clauses',
    'preview.fullyEditable': 'Fully Editable',
    'preview.fullyEditableDesc': 'Customize further after purchase',
    'preview.instantDownload': 'Instant Download',
    'preview.instantDownloadDesc': 'PDF and editable formats',
    'preview.purchaseDocument': 'Purchase Document',
    'preview.securePayment': 'Secure payment • No refunds - Preview before purchase',
    'preview.documentUnlocked': 'Document Unlocked',
    'preview.canEditDownload': 'You can now edit and download your document',
    'preview.downloadAsPDF': 'Download as PDF',
    'preview.editDocument': 'Edit Document',
    'preview.documentDetails': 'Document Details',
    'preview.template': 'Template',
    'preview.category': 'Category',
    'preview.fieldsCompleted': 'Fields Completed',
    'preview.legalDisclaimer': 'Legal Disclaimer',
    'preview.disclaimerText': 'This document is provided as a template for informational purposes only and does not constitute legal advice. We strongly recommend having any legal document reviewed by a qualified attorney before use.',
    'preview.purchaseToDownload': 'Please purchase the document to download without watermarks',
    'preview.documentDownloaded': 'Document downloaded!',
    'preview.exportLanguage': 'Export Language',
    'preview.exportLanguageDesc': 'Choose the language for your final document',
    'preview.english': 'English (Legally valid in USA)',
    'preview.spanish': 'Spanish (Translation)',
    
    // Checkout Page
    'checkout.back': 'Back',
    'checkout.secureCheckout': 'Secure Checkout',
    'checkout.paymentInfo': 'Payment Information',
    'checkout.paymentSecured': 'Your payment is secured with industry-standard encryption',
    'checkout.emailAddress': 'Email Address',
    'checkout.emailPlaceholder': 'your@email.com',
    'checkout.receiptSent': 'Receipt and document will be sent to this email',
    'checkout.cardNumber': 'Card Number',
    'checkout.cardholderName': 'Cardholder Name',
    'checkout.expiryDate': 'Expiry Date',
    'checkout.cvv': 'CVV',
    'checkout.sslEncryption': '256-bit SSL Encryption',
    'checkout.pciCompliant': 'PCI DSS Compliant',
    'checkout.paymentNeverStored': 'Your payment information is never stored on our servers. All transactions are processed securely.',
    'checkout.processingPayment': 'Processing Payment...',
    'checkout.pay': 'Pay',
    'checkout.acceptCards': 'We accept all major credit cards',
    'checkout.orderSummary': 'Order Summary',
    'checkout.documentPrice': 'Document Price',
    'checkout.processingFee': 'Processing Fee',
    'checkout.total': 'Total',
    'checkout.whatsIncluded': "What's Included:",
    'checkout.instantAccess': 'Instant access to full document',
    'checkout.fullEditing': 'Full editing capabilities',
    'checkout.downloadFormats': 'Download in multiple formats',
    'checkout.lifetimeAccess': 'Lifetime access to your document',
    'checkout.emailDelivery': 'Email delivery of receipt',
    'checkout.noRefundPolicy': 'No Refund Policy',
    'checkout.noRefundDesc': 'All sales are final. Preview the complete document with watermarks before purchasing to ensure it meets your needs.',
    'checkout.fillAllPaymentDetails': 'Please fill in all payment details',
    'checkout.paymentSuccessful': 'Payment successful! 🎉',
    'checkout.redirecting': 'Redirecting to your document...',
    
    // Success Page
    'success.title': 'Purchase Successful!',
    'success.message': 'Your document is ready to download.',
    'success.download': 'Download Document',
    'success.edit': 'Edit Document',
    'success.newDocument': 'Create New Document',
    'success.emailSent': 'A copy has been sent to your email',
    'success.editAnytime': 'You can edit and re-download this document anytime',
    'success.support': 'Need help? Contact our support team',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.close': 'Close',
    'common.backHome': 'Back to Home',
  },
  es: {
    // Header
    'header.title': 'Centro de Documentos',
    'header.subtitle': 'Documentos Legales Profesionales',
    
    // Hero
    'hero.title': 'Documentos Legales Profesionales en Minutos',
    'hero.subtitle': 'Genera documentos legales redactados por abogados al instante. Paga solo $4-$10 por documento en lugar de cientos en honorarios legales. Vista previa gratis con marcas de agua, compra para descargar.',
    'hero.cta': 'Ver Documentos',
    'hero.feature1': 'Vista Previa Gratis',
    'hero.feature2': 'Descarga Instantánea',
    'hero.feature3': 'Calidad Profesional',
    'hero.feature4': 'Control Completo',
    
    // Document Generator Page
    'generator.backToTemplates': 'Volver a Plantillas',
    'generator.step': 'Paso',
    'generator.of': 'de',
    'generator.complete': 'Completar',
    'generator.documentInfo': 'Información del Documento',
    'generator.fillRequired': 'Llena la información requerida. Todos los campos marcados con * son obligatorios.',
    'generator.previous': 'Anterior',
    'generator.next': 'Siguiente',
    'generator.previewDocument': 'Vista Previa del Documento',
    'generator.fillAllFields': 'Por favor, llena todos los campos requeridos',
    'generator.selectOption': 'Selecciona una opción',
    'generator.templateNotFound': 'Plantilla no encontrada',
    'generator.phonePlaceholder': 'Ej: (555) 123-4567',
    
    // Preview Page
    'preview.backToForm': 'Volver al Formulario',
    'preview.purchased': 'Comprado',
    'preview.previewMode': 'Modo de Vista Previa',
    'preview.previewModeDesc': 'Esta es una vista previa con marca de agua. Compra para desbloquear la capacidad de edición completa y descarga.',
    'preview.documentPreview': 'Vista Previa del Documento',
    'preview.edit': 'Editar',
    'preview.saveEdits': 'Guardar Ediciones',
    'preview.download': 'Descargar',
    'preview.editDirectly': 'Edita el documento directamente a continuación',
    'preview.scrollReview': 'Desplázate para revisar tu documento',
    'preview.changesSaved': 'Cambios guardados en la vista previa',
    'preview.readyToDownload': '¿Listo para Descargar?',
    'preview.purchaseToUnlock': 'Compra para desbloquear el documento completo sin marcas de agua',
    'preview.oneTime': 'una vez',
    'preview.professionalGrade': 'Calidad Profesional',
    'preview.professionalGradeDesc': 'Redactado por abogados con todas las cláusulas necesarias',
    'preview.fullyEditable': 'Totalmente Editable',
    'preview.fullyEditableDesc': 'Personaliza más después de la compra',
    'preview.instantDownload': 'Descarga Instantánea',
    'preview.instantDownloadDesc': 'Formatos PDF y editable',
    'preview.purchaseDocument': 'Comprar Documento',
    'preview.securePayment': 'Pago seguro • Sin reembolsos - Vista previa antes de comprar',
    'preview.documentUnlocked': 'Documento Desbloqueado',
    'preview.canEditDownload': 'Ahora puedes editar y descargar tu documento',
    'preview.downloadAsPDF': 'Descargar como PDF',
    'preview.editDocument': 'Editar Documento',
    'preview.documentDetails': 'Detalles del Documento',
    'preview.template': 'Plantilla',
    'preview.category': 'Categoría',
    'preview.fieldsCompleted': 'Campos Completados',
    'preview.legalDisclaimer': 'Aviso Legal',
    'preview.disclaimerText': 'Este documento se proporciona como plantilla solo con fines informativos y no constituye asesoramiento legal. Te recomendamos fuertemente que cualquier documento legal sea revisado por un abogado calificado antes de su uso.',
    'preview.purchaseToDownload': 'Por favor, compra el documento para descargarlo sin marcas de agua',
    'preview.documentDownloaded': '¡Documento descargado!',
    'preview.exportLanguage': 'Exportar Idioma',
    'preview.exportLanguageDesc': 'Elige el idioma para tu documento final',
    'preview.english': 'Inglés (Válido legalmente en USA)',
    'preview.spanish': 'Español (Traducción)',
    
    // Checkout Page
    'checkout.back': 'Volver',
    'checkout.secureCheckout': 'Checkout Seguro',
    'checkout.paymentInfo': 'Información de Pago',
    'checkout.paymentSecured': 'Tu pago está seguro con cifrado estándar de la industria',
    'checkout.emailAddress': 'Correo Electrónico',
    'checkout.emailPlaceholder': 'tu@email.com',
    'checkout.receiptSent': 'Recibo y documento se enviarán a este correo electrónico',
    'checkout.cardNumber': 'Número de Tarjeta',
    'checkout.cardholderName': 'Nombre del Titular',
    'checkout.expiryDate': 'Fecha de Vencimiento',
    'checkout.cvv': 'CVV',
    'checkout.sslEncryption': 'Cifrado SSL de 256 bits',
    'checkout.pciCompliant': 'Cumple con PCI DSS',
    'checkout.paymentNeverStored': 'Tu información de pago nunca se almacena en nuestros servidores. Todas las transacciones se procesan de forma segura.',
    'checkout.processingPayment': 'Procesando Pago...',
    'checkout.pay': 'Pagar',
    'checkout.acceptCards': 'Aceptamos todas las tarjetas de crédito principales',
    'checkout.orderSummary': 'Resumen del Pedido',
    'checkout.documentPrice': 'Precio del Documento',
    'checkout.processingFee': 'Tarifa de Procesamiento',
    'checkout.total': 'Total',
    'checkout.whatsIncluded': '¿Qué Incluye:',
    'checkout.instantAccess': 'Acceso instantáneo al documento completo',
    'checkout.fullEditing': 'Capacidades de edición completa',
    'checkout.downloadFormats': 'Descarga en múltiples formatos',
    'checkout.lifetimeAccess': 'Acceso de por vida a tu documento',
    'checkout.emailDelivery': 'Entrega por correo electrónico del recibo',
    'checkout.noRefundPolicy': 'Política de No Reembolso',
    'checkout.noRefundDesc': 'Todas las ventas son finales. Revisa el documento completo con marcas de agua antes de comprar para asegurarte de que cumple con tus necesidades.',
    'checkout.fillAllPaymentDetails': 'Por favor, llena todos los detalles de pago',
    'checkout.paymentSuccessful': '¡Pago exitoso! 🎉',
    'checkout.redirecting': 'Redirigiendo a tu documento...',
    
    // Success Page
    'success.title': '¡Compra Exitosa!',
    'success.message': 'Tu documento está listo para descargar.',
    'success.download': 'Descargar Documento',
    'success.edit': 'Editar Documento',
    'success.newDocument': 'Crear Nuevo Documento',
    'success.emailSent': 'Se ha enviado una copia a tu correo electrónico',
    'success.editAnytime': 'Puedes editar y volver a descargar este documento en cualquier momento',
    'success.support': '¿Necesitas ayuda? Contacta a nuestro equipo de soporte',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.close': 'Cerrar',
    'common.backHome': 'Volver al Inicio',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('codec_language') : null;
    if (stored === 'en' || stored === 'es') return stored;

    if (typeof navigator !== 'undefined') {
      const lang = (navigator.language || '').toLowerCase();
      const isEnglishLocale = lang.startsWith('en') || lang.includes('us');
      return isEnglishLocale ? 'en' : 'es';
    }

    return 'en';
  });

  // Real IP-based geolocation, once, on a visitor's very first load — a US
  // client should land in English, a Colombian (or any other) visitor in
  // Spanish, regardless of what their browser's own locale/Accept-Language
  // says (a US-bought laptop with Windows still set to es-ES, a VPN, etc.).
  // Only runs when there's no stored preference yet — once a language is
  // saved (by this lookup or a manual toggle), that choice is respected on
  // every later visit instead of re-querying the geo API each time.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem('codec_language')) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);

    fetch('https://ipwho.is/', { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { success?: boolean; country_code?: string }) => {
        if (!data?.success) return;
        setLanguage(data.country_code === 'US' ? 'en' : 'es');
      })
      .catch(() => { /* geo lookup unavailable — keep the browser-locale guess */ })
      .finally(() => window.clearTimeout(timeout));

    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('codec_language', language);
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}