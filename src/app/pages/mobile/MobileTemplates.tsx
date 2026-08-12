import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Search, FileText, ArrowRight, LayoutGrid, type LucideIcon } from 'lucide-react';
import { MobileAppShell } from '../../components/mobile/MobileAppShell';
import { useLanguage } from '../../contexts/language-context';
import { documentTemplates } from '../../data/templates';
import { CATEGORIAS, claveCategoria, nombreCategoria, metaCategoria } from '../../data/categories-meta';
import { getDocumentTranslation } from '../../data/document-translations';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

/** Un círculo del menú de secciones. Algo más pequeño que en escritorio: aquí
 *  van en una tira que se desliza y tienen que caber cuatro o cinco a la vez
 *  para que se entienda que hay más al lado. */
function CirculoSeccion({ activa, color, Icono, nombre, cuantas, onClick }: {
  activa: boolean;
  color: string;
  Icono: LucideIcon;
  nombre: string;
  cuantas: number;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-[74px] shrink-0 flex-col items-center gap-1.5">
      <motion.span
        whileTap={{ scale: 0.92 }}
        className="relative flex size-[54px] items-center justify-center rounded-full"
        style={activa
          ? { background: color, boxShadow: `0 10px 20px ${color}59` }
          : { background: '#fff', boxShadow: CARD_SHADOW, border: `1.5px solid ${color}26` }}
      >
        <Icono className="size-5" style={{ color: activa ? '#fff' : color }} />
        <span
          className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full px-1 py-0.5 text-[9px] font-black tabular-nums"
          style={activa ? { background: '#fff', color } : { background: color, color: '#fff' }}
        >
          {cuantas}
        </span>
      </motion.span>
      <span
        className="text-center text-[10px] font-bold leading-tight"
        style={{ color: activa ? color : '#475569' }}
      >
        {nombre}
      </span>
    </button>
  );
}

export function MobileTemplates() {
  return (
    <MobileAppShell>
      <TemplatesContent />
    </MobileAppShell>
  );
}

function TemplatesContent() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documentTemplates.filter((t) => {
      const matchesCategory = !activeCategory || claveCategoria(t.category) === activeCategory;
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
        <h1 className="text-xl font-black text-white">{language === 'en' ? 'Templates' : 'Plantillas'}</h1>
        <p className="mt-0.5 text-xs text-blue-100">{language === 'en' ? 'Choose a template to get started' : 'Elige una plantilla para empezar'}</p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search templates...' : 'Buscar plantillas...'}
            className="w-full rounded-2xl bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none"
          />
        </div>
      </div>

      <div className="px-4 pt-4">
      {/* Secciones en círculos, igual que en escritorio, en tira horizontal
          porque en un teléfono no caben en dos filas. Todos del mismo tamaño
          y alineados: una fila de pastillas de anchos distintos se lee como
          una lista desordenada, y una de círculos se lee como un menú. */}
      <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        <CirculoSeccion
          activa={activeCategory === null}
          color="#0F172A"
          Icono={LayoutGrid}
          nombre={language === 'en' ? 'All' : 'Todas'}
          cuantas={documentTemplates.length}
          onClick={() => setActiveCategory(null)}
        />
        {CATEGORIAS.map((c) => {
          const cuantas = documentTemplates.filter((t) => claveCategoria(t.category) === c.id).length;
          if (cuantas === 0) return null;
          return (
            <CirculoSeccion
              key={c.id}
              activa={activeCategory === c.id}
              color={c.color}
              Icono={c.icono}
              nombre={nombreCategoria(c.id, language)}
              cuantas={cuantas}
              onClick={() => setActiveCategory(activeCategory === c.id ? null : c.id)}
            />
          );
        })}
      </div>

      {/* Template cards */}
      <div className="mt-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white px-4 py-10 text-center" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
            <Search className="mx-auto mb-2 size-6 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">{language === 'en' ? 'No results' : 'Sin resultados'}</p>
          </div>
        ) : (
          filtered.map((t) => {
            const meta = metaCategoria(claveCategoria(t.category));
            const Icon = meta?.icono ?? FileText;
            const acento = meta?.color ?? '#4F46E5';
            const name = getDocumentTranslation(t.id, 'name', language) || t.name;
            const description = getDocumentTranslation(t.id, 'desc', language) || t.description;
            return (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigate(`/generator/${t.id}`)}
                className="flex w-full items-center gap-3 bg-white p-4 text-left"
                style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: acento + '14' }}>
                  <Icon className="size-5" style={{ color: acento }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{description}</p>
                </div>
                <span
                  className="flex shrink-0 items-center justify-center rounded-xl"
                  style={{ width: 36, height: 36, background: '#EFF6FF' }}
                >
                  <ArrowRight className="size-4 text-blue-600" />
                </span>
              </motion.button>
            );
          })
        )}
      </div>
      </div>
    </div>
  );
}
