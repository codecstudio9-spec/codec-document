import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Contact as ContactIcon, Loader, Mail, Phone, Building, FileCheck, FileText, Clock, Search, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { getMyContacts, updateContactNotes, type Contact } from '../services/crm-service';

function ContactCard({ contact, language, onSaved }: { contact: Contact; language: 'en' | 'es'; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(contact.notes ?? '');
  const [phone, setPhone] = useState(contact.phone ?? '');
  const [company, setCompany] = useState(contact.company ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateContactNotes(contact.id, notes, phone, company);
      toast.success(language === 'en' ? 'Saved.' : 'Guardado.');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not save.' : 'No se pudo guardar.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 text-left">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600">
          {(contact.name || contact.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{contact.name || contact.email}</p>
          <p className="truncate text-xs text-slate-400">{contact.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><FileText className="size-3.5" />{contact.documents_sent}</span>
          <span className="flex items-center gap-1 text-emerald-600"><FileCheck className="size-3.5" />{contact.documents_signed}</span>
        </div>
      </button>
      {contact.last_activity_at && (
        <p className="ml-13 mt-1 flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="size-3" />
          {language === 'en' ? 'Last activity' : 'Última actividad'}: {new Date(contact.last_activity_at).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
      {open && (
        <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500"><Phone className="size-3" />{language === 'en' ? 'Phone' : 'Teléfono'}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500"><Building className="size-3" />{language === 'en' ? 'Company' : 'Empresa'}</label>
              <input value={company} onChange={(e) => setCompany(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">{language === 'en' ? 'Notes' : 'Notas'}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {saving ? <Loader className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {language === 'en' ? 'Save' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  );
}

export function MyContactsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [query, setQuery] = useState('');

  const load = () => { getMyContacts().then(setContacts).catch(() => setContacts([])); };
  useEffect(() => { if (user) load(); }, [user]);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <p className="text-lg font-bold text-slate-800">{language === 'en' ? 'Sign in to see your contacts' : 'Inicia sesión para ver tus contactos'}</p>
        <Link to="/" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">{language === 'en' ? 'Go home' : 'Ir al inicio'}</Link>
      </div>
    );
  }

  const filtered = (contacts ?? []).filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (c.name ?? '').toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.company ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => navigate(window.matchMedia('(max-width: 767px)').matches ? '/app' : '/dashboard')}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="size-4" />
          {language === 'en' ? 'Back' : 'Volver'}
        </button>

        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
          <ContactIcon className="size-6 text-indigo-600" />
          {language === 'en' ? 'Contacts' : 'Contactos'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {language === 'en'
            ? 'Everyone who has signed or received a document from you — saved automatically.'
            : 'Todos los que han firmado o recibido un documento tuyo — se guardan automáticamente.'}
        </p>

        <div className="relative mt-5">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search by name, email or company' : 'Buscar por nombre, correo o empresa'}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div className="mt-4 space-y-2.5">
          {contacts === null ? (
            <div className="flex justify-center py-10"><Loader className="size-6 animate-spin text-indigo-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Mail className="mx-auto mb-2 size-7 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">
                {contacts.length === 0
                  ? (language === 'en' ? 'No contacts yet — they\'ll appear here once someone signs a document you sent.' : 'Aún no tienes contactos — aparecerán aquí cuando alguien firme un documento que enviaste.')
                  : (language === 'en' ? 'No matches.' : 'Sin resultados.')}
              </p>
            </div>
          ) : (
            filtered.map((c) => <ContactCard key={c.id} contact={c} language={language} onSaved={load} />)
          )}
        </div>
      </div>
    </div>
  );
}
