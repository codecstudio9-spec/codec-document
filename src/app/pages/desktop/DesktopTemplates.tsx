import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Search, FileText, Home, Briefcase, Building2, DollarSign, Globe, ArrowRight } from 'lucide-react';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { documentTemplates, categories } from '../../data/templates';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

const CATEGORY_ICON: Record<string, typeof FileText> = {
  'Estate Planning & Personal': FileText,
  'Real Estate & Property': Home,
  'Business Contracts': Briefcase,
  'Business Formation': Building2,
  'Financial & Lending': DollarSign,
  'Digital & Website': Globe,
};

export function DesktopTemplates() {
  return (
    <DesktopAppShell>
      <TemplatesContent />
    </DesktopAppShell>
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
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-black text-slate-900">Plantillas</h1>

      <div className="mt-5 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar plantillas..."
            className="w-full rounded-2xl bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none"
            style={{ boxShadow: CARD_SHADOW }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className="rounded-full px-4 py-2 text-xs font-bold transition"
            style={activeCategory === null ? { background: '#2563EB', color: '#fff' } : { background: '#fff', color: '#374151', boxShadow: CARD_SHADOW }}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className="rounded-full px-4 py-2 text-xs font-bold transition"
              style={activeCategory === cat ? { background: '#2563EB', color: '#fff' } : { background: '#fff', color: '#374151', boxShadow: CARD_SHADOW }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 bg-white px-6 py-16 text-center" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
            <Search className="mx-auto mb-2 size-7 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">Sin resultados</p>
          </div>
        ) : (
          filtered.map((t) => {
            const Icon = CATEGORY_ICON[t.category] ?? FileText;
            return (
              <motion.div
                key={t.id}
                whileHover={{ y: -2 }}
                className="flex flex-col gap-3 bg-white p-5"
                style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
              >
                <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50">
                  <Icon className="size-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{t.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/generator/${t.id}`)}
                  className="mt-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
                >
                  Usar plantilla <ArrowRight className="size-3.5" />
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
