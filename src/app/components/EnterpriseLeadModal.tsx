import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, Loader, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/language-context';
import { submitBusinessLead } from '../services/business-leads-service';

interface EnterpriseLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPLOYEE_RANGES = ['1-10', '11-50', '51-200', '201-500', '500+'];

/** Small premium teaser + modal for the "Soluciones para Empresas" section
 * on the home page — deliberately not a big form embedded in the page
 * itself, per spec. Submits via submit_business_lead() (SECURITY DEFINER,
 * public INSERT-only), read later from the admin Business Intelligence tab. */
export function EnterpriseLeadModal({ open, onOpenChange }: EnterpriseLeadModalProps) {
  const { language } = useLanguage();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employees, setEmployees] = useState(EMPLOYEE_RANGES[0]);
  const [country, setCountry] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) { setSubmitted(false); }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error(language === 'en' ? 'Name and email are required.' : 'Nombre y correo son obligatorios.');
      return;
    }
    setSubmitting(true);
    try {
      await submitBusinessLead({ name, company, position, email, phone, employees, country, message, language });
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not send the request.' : 'No se pudo enviar la solicitud.'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="lead-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => onOpenChange(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '16px',
            background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <motion.div
            key="lead-card"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-4" />
            </button>

            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle2 className="size-12 text-emerald-500" />
                <p className="text-lg font-black text-slate-900">
                  {language === 'en' ? 'Request received!' : '¡Solicitud recibida!'}
                </p>
                <p className="max-w-xs text-sm text-slate-500">
                  {language === 'en'
                    ? 'A specialist will contact you shortly.'
                    : 'Un especialista se pondrá en contacto contigo pronto.'}
                </p>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="mt-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"
                >
                  {language === 'en' ? 'Close' : 'Cerrar'}
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-50">
                    <Building2 className="size-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">
                      {language === 'en' ? 'Talk to a specialist' : 'Hablar con un especialista'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {language === 'en' ? 'Tell us about your company — we\'ll reach out.' : 'Cuéntanos de tu empresa — te contactamos.'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder={language === 'en' ? 'Name *' : 'Nombre *'} className={inputClass} />
                  <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={language === 'en' ? 'Company' : 'Empresa'} className={inputClass} />
                  <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder={language === 'en' ? 'Role' : 'Cargo'} className={inputClass} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={language === 'en' ? 'Email *' : 'Correo *'} className={inputClass} />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={language === 'en' ? 'Phone' : 'Teléfono'} className={inputClass} />
                  <select value={employees} onChange={(e) => setEmployees(e.target.value)} className={inputClass}>
                    {EMPLOYEE_RANGES.map((r) => <option key={r} value={r}>{r} {language === 'en' ? 'employees' : 'empleados'}</option>)}
                  </select>
                  <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder={language === 'en' ? 'Country' : 'País'} className={`${inputClass} sm:col-span-2`} />
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={language === 'en' ? 'Message' : 'Mensaje'} rows={3} className={`${inputClass} sm:col-span-2`} />
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSubmit()}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-50"
                >
                  {submitting ? <Loader className="size-4 animate-spin" /> : <Building2 className="size-4" />}
                  {language === 'en' ? 'Send request' : 'Enviar solicitud'}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
