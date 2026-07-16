import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, FileText, Home, Briefcase, Building2, DollarSign, Globe, ArrowRight } from 'lucide-react';
import { MobileAppShell } from '../../components/mobile/MobileAppShell';
import { documentTemplates, categories } from '../../data/templates';

const CATEGORY_ICON: Record<string, typeof FileText> = {
  'Estate Planning & Personal': FileText,
  'Real Estate & Property': Home,
  'Business Contracts': Briefcase,
  'Business Formation': Building2,
  'Financial & Lending': DollarSign,
  'Digital & Website': Globe,
};

export function MobileTemplates() {
  return (
    <MobileAppShell>
      <TemplatesContent />
    </MobileAppShell>
  );
}

function TemplatesContent() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documentTemplates.filter((t) => {
      const matchesCategory = !activeCategory || t.category === activeCategory;
      const matchesQuery = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  return (
    <div>
      {/* Blue header block — title, subtitle, search all live on the
          brand color, matching Firmas/Perfil's dark/blue-block treatment
          so the whole shell isn't just white-on-white. */}
      <div className="px-4 pb-5 pt-6" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}>
        <h1 className="text-xl font-black text-white">Plantillas</h1>
        <p className="mt-0.5 text-xs text-blue-100">Elige una plantilla para empezar</p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar plantillas..."
            className="w-full rounded-2xl bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none"
          />
        </div>
      </div>

      <div className="px-4 pt-4">
      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition active:scale-95"
          style={
            activeCategory === null
              ? { background: '#2563EB', color: '#fff' }
              : { background: '#fff', color: '#374151', border: '1px solid #E5E7EB' }
          }
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition active:scale-95"
            style={
              activeCategory === cat
                ? { background: '#2563EB', color: '#fff' }
                : { background: '#fff', color: '#374151', border: '1px solid #E5E7EB' }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template cards */}
      <div className="mt-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-10 text-center" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
            <Search className="mx-auto mb-2 size-6 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">Sin resultados</p>
          </div>
        ) : (
          filtered.map((t) => {
            const Icon = CATEGORY_ICON[t.category] ?? FileText;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate(`/generator/${t.id}`)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left transition active:scale-[0.98]"
                style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
                  <Icon className="size-5 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{t.description}</p>
                </div>
                <span
                  className="flex shrink-0 items-center justify-center rounded-xl"
                  style={{ width: 36, height: 36, background: '#EFF6FF' }}
                >
                  <ArrowRight className="size-4 text-blue-600" />
                </span>
              </button>
            );
          })
        )}
      </div>
      </div>
    </div>
  );
}
