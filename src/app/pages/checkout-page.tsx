import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { CreditCard, Lock, ShieldCheck, ArrowLeft, Package, CheckCircle2, Zap, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/language-context';
import { getDocumentTranslation } from '../data/document-translations';
import { PayPalCheckoutBackend } from '../components/paypal-checkout-backend';
import { useAuth } from '../contexts/auth-context';
import { saveMyPurchasedDocument } from '../services/auth-service';

const BUNDLE_PRICE = 12;
const BUNDLE_BONUS_IDS = ['rental-application', 'move-in-checklist'];
const BUNDLE_BONUS_NAMES = ['Rental Application', 'Move-In Checklist'];

export function CheckoutPage() {
  const navigate = useNavigate();
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [, setIsProcessing] = useState(false);
  const { t, language } = useLanguage();
  const { token, refreshPurchasedDocuments, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'bundle'>('single');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email.trim());

  const isEligibleForBundle = purchaseData?.template?.price === 7;
  const effectivePrice = isEligibleForBundle && selectedPlan === 'bundle'
    ? BUNDLE_PRICE
    : purchaseData?.template?.price ?? 0;

  useEffect(() => {
    const saved = sessionStorage.getItem('purchaseDocument');
    if (!saved) {
      navigate('/');
      return;
    }
    setPurchaseData(JSON.parse(saved));
  }, [navigate]);

  if (!purchaseData) {
    return null;
  }

  const handlePayPalSuccess = async (orderId: string) => {
    console.log('PayPal Order ID:', orderId);
    const isBundle = isEligibleForBundle && selectedPlan === 'bundle';

    sessionStorage.setItem('isPurchased', 'true');
    sessionStorage.setItem('paypalOrderId', orderId);
    sessionStorage.setItem('purchaserEmail', email.trim());
    sessionStorage.setItem('purchasedBundle', isBundle ? 'true' : 'false');
    localStorage.setItem(`codec_purchase_${purchaseData.template.id}`, 'true');
    localStorage.setItem('paypalOrderId', orderId);
    localStorage.setItem('purchaserEmail', email.trim());

    if (isBundle) {
      BUNDLE_BONUS_IDS.forEach((id) => {
        localStorage.setItem(`codec_purchase_${id}`, 'true');
      });
    }

    if (token) {
      const docsToPersist = [
        { documentId: purchaseData.template.id, documentName: purchaseData.template.name, orderId },
        ...(isBundle
          ? BUNDLE_BONUS_IDS.map((id, i) => ({ documentId: id, documentName: BUNDLE_BONUS_NAMES[i], orderId }))
          : []),
      ];
      try {
        await Promise.all(docsToPersist.map((d) => saveMyPurchasedDocument(token, d)));
        await refreshPurchasedDocuments();
      } catch (error) {
        console.warn('No se pudo sincronizar compra con la cuenta del usuario:', error);
      }
    }

    toast.success(
      isBundle
        ? (language === 'es' ? '¡Bundle descargado! Accediendo a tus 3 documentos...' : 'Bundle unlocked! Accessing your 3 documents...')
        : (language === 'es' ? '¡Pago completado! Redirigiendo a tu documento...' : 'Payment completed! Redirecting to your document...')
    );

    setTimeout(() => {
      navigate(`/preview/${purchaseData.template.id}`);
    }, 1500);
  };

  const handlePayPalError = (error: any) => {
    console.error('PayPal error:', error);
    setIsProcessing(false);
  };

  const handleAdminAccess = async () => {
    sessionStorage.setItem('isPurchased', 'true');
    sessionStorage.setItem('purchaserEmail', 'douglastabordasanchez@gmail.com');
    sessionStorage.setItem('purchasedBundle', 'true');
    localStorage.setItem(`codec_purchase_${purchaseData.template.id}`, 'true');
    localStorage.setItem('purchaserEmail', 'douglastabordasanchez@gmail.com');
    BUNDLE_BONUS_IDS.forEach((id) => localStorage.setItem(`codec_purchase_${id}`, 'true'));

    if (token) {
      try {
        await saveMyPurchasedDocument(token, {
          documentId: purchaseData.template.id,
          documentName: purchaseData.template.name,
          orderId: `ADMIN-${purchaseData.template.id}`,
        });
        await refreshPurchasedDocuments();
      } catch (error) {
        console.warn('No se pudo sincronizar acceso admin con la cuenta:', error);
      }
    }

    toast.success(
      language === 'es'
        ? 'Acceso admin activado. Mostrando documento desbloqueado.'
        : 'Admin access activated. Showing unlocked document.'
    );

    navigate(`/preview/${purchaseData.template.id}`);
  };

  const getCategoryTranslation = (category: string) => {
    const categoryMap: Record<string, string> = {
      'Estate Planning & Personal': 'category.estate',
      'Real Estate & Property': 'category.realestate',
      'Business Contracts': 'category.business',
      'Business Formation': 'category.formation',
      'Financial & Lending': 'category.financial',
      'Digital & Website': 'category.digital',
    };
    return t(categoryMap[category] || category);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="size-5" />
              <span>{t('checkout.back')}</span>
            </button>
            <div className="flex items-center gap-2">
              <Lock className="size-5 text-green-600" />
              <span className="font-medium">{t('checkout.secureCheckout')}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-5 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-6" />
                  {t('checkout.paymentInfo')}
                </CardTitle>
                <CardDescription>
                  {language === 'es' 
                    ? 'Paga de forma segura con PayPal. Acepta tarjetas de crédito, débito y saldo de PayPal.'
                    : 'Pay securely with PayPal. Accepts credit cards, debit cards, and PayPal balance.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Email */}
                <div className="space-y-2 mb-6">
                  <Label htmlFor="email">
                    {t('checkout.emailAddress')} *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('checkout.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-slate-500">
                    {t('checkout.receiptSent')}
                  </p>
                </div>

                <Separator className="my-6" />

                {/* PayPal Buttons */}
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      {language === 'es' 
                        ? 'Selecciona tu método de pago'
                        : 'Select your payment method'}
                    </p>
                  </div>

                  <PayPalCheckoutBackend
                    amount={effectivePrice}
                    documentName={
                      isEligibleForBundle && selectedPlan === 'bundle'
                        ? `Legal Bundle (${purchaseData.template.name} + 2 extras)`
                        : purchaseData.template.name
                    }
                    documentId={purchaseData.template.id}
                    documentContent={purchaseData.content}
                    customerEmail={email.trim()}
                    isEmailValid={isEmailValid}
                    onSuccess={handlePayPalSuccess}
                    onError={handlePayPalError}
                    onAdminAccess={handleAdminAccess}
                    language={language}
                  />
                </div>

                <Separator className="my-6" />

                {/* Security Badges */}
                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="size-5 text-green-600" />
                    <span className="font-medium">
                      {language === 'es' ? 'Encriptación SSL de 256 bits' : '256-bit SSL Encryption'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Lock className="size-5 text-green-600" />
                    <span className="font-medium">
                      {language === 'es' ? 'Protección del comprador de PayPal' : 'PayPal Buyer Protection'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {language === 'es'
                      ? 'Tus datos de pago están protegidos por PayPal y nunca se almacenan en nuestros servidores.'
                      : 'Your payment data is protected by PayPal and never stored on our servers.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Info */}
            <div className="mt-6">
              <p className="text-sm text-slate-600 text-center mb-3">
                {language === 'es' 
                  ? 'PayPal acepta todas las tarjetas principales'
                  : 'PayPal accepts all major cards'}
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Badge variant="outline" className="px-4 py-2">
                  Visa
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  Mastercard
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  American Express
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  Discover
                </Badge>
                <Badge variant="outline" className="px-4 py-2 bg-blue-50 border-blue-300">
                  <span className="text-blue-700 font-semibold">PayPal</span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>{t('checkout.orderSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">{getDocumentTranslation(purchaseData.template.id, 'name', language)}</h4>
                  <p className="text-sm text-slate-600 mb-3">
                    {getDocumentTranslation(purchaseData.template.id, 'desc', language)}
                  </p>
                  <Badge variant="secondary">{getCategoryTranslation(purchaseData.template.category)}</Badge>
                </div>

                {/* Bundle upsell — only shown for $7 documents and non-admin users */}
                {isEligibleForBundle && !isAdmin && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {language === 'es' ? 'Elige tu plan' : 'Choose your plan'}
                      </p>

                      {/* Single doc option */}
                      <button
                        type="button"
                        onClick={() => setSelectedPlan('single')}
                        className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                          selectedPlan === 'single'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`flex size-8 items-center justify-center rounded-lg ${selectedPlan === 'single' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                              <Zap className={`size-4 ${selectedPlan === 'single' ? 'text-blue-600' : 'text-slate-500'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {language === 'es' ? 'Documento individual' : 'Single Document'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {language === 'es' ? '1 descarga limpia' : '1 clean download'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-900">${purchaseData.template.price}</span>
                            {selectedPlan === 'single' && (
                              <CheckCircle2 className="size-5 text-blue-500" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Bundle option */}
                      <button
                        type="button"
                        onClick={() => setSelectedPlan('bundle')}
                        className={`relative w-full overflow-hidden rounded-xl border-2 p-3 text-left transition-all ${
                          selectedPlan === 'bundle'
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-amber-300 bg-amber-50 hover:border-amber-400'
                        }`}
                      >
                        {/* Best value ribbon */}
                        <div className="absolute right-0 top-0 rounded-bl-lg bg-amber-400 px-2 py-0.5 text-[10px] font-black text-amber-900">
                          {language === 'es' ? 'MEJOR VALOR' : 'BEST VALUE'}
                        </div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${selectedPlan === 'bundle' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                              <Package className={`size-4 ${selectedPlan === 'bundle' ? 'text-emerald-600' : 'text-amber-600'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {language === 'es' ? 'Legal Bundle' : 'Legal Bundle'}
                              </p>
                              <ul className="mt-1 space-y-0.5">
                                <li className="flex items-center gap-1 text-xs text-slate-600">
                                  <FileText className="size-3 text-emerald-500" />
                                  {getDocumentTranslation(purchaseData.template.id, 'name', language)}
                                </li>
                                <li className="flex items-center gap-1 text-xs text-slate-600">
                                  <FileText className="size-3 text-emerald-500" />
                                  {language === 'es' ? 'Solicitud de Arrendamiento' : 'Rental Application'}
                                </li>
                                <li className="flex items-center gap-1 text-xs text-slate-600">
                                  <FileText className="size-3 text-emerald-500" />
                                  {language === 'es' ? 'Lista de Revisión de Mudanza' : 'Move-In Checklist'}
                                </li>
                              </ul>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-lg font-bold text-emerald-700">${BUNDLE_PRICE}</span>
                            <span className="text-[10px] text-slate-400 line-through">${purchaseData.template.price * 3}</span>
                            {selectedPlan === 'bundle' && (
                              <CheckCircle2 className="size-5 text-emerald-500" />
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{t('checkout.documentPrice')}</span>
                    <span className="font-medium">
                      {isEligibleForBundle && selectedPlan === 'bundle'
                        ? `$${BUNDLE_PRICE} (3 docs)`
                        : `$${purchaseData.template.price}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{t('checkout.processingFee')}</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                  {isEligibleForBundle && selectedPlan === 'bundle' && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span className="font-medium">
                        {language === 'es' ? 'Ahorro en bundle' : 'Bundle savings'}
                      </span>
                      <span className="font-bold">-${purchaseData.template.price * 3 - BUNDLE_PRICE}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-semibold">{t('checkout.total')}</span>
                  <span className="text-3xl font-bold text-blue-600">
                    ${effectivePrice}
                  </span>
                </div>

                <Separator />

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h5 className="font-semibold text-sm text-green-900 mb-2">
                    {t('checkout.whatsIncluded')}
                  </h5>
                  <ul className="space-y-1.5 text-xs text-green-800">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{t('checkout.instantAccess')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{t('checkout.fullEditing')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{t('checkout.downloadFormats')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{t('checkout.lifetimeAccess')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{t('checkout.emailDelivery')}</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h5 className="font-semibold text-sm text-amber-900 mb-1">
                    {t('checkout.noRefundPolicy')}
                  </h5>
                  <p className="text-xs text-amber-800">
                    {t('checkout.noRefundDesc')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}