import type { DetectedField } from '../../../lib/docxTemplateEngine';

interface DynamicDocFormProps {
  fields: DetectedField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  language: 'en' | 'es';
}

/**
 * Renders one input per detected {{variable}} from a Word template —
 * text/date/number/choice, using each field's own label (either the
 * contextual label lifted from text like "Nombre del Cliente: {{tag}}",
 * or a humanized version of the variable key — see
 * src/lib/docxTemplateEngine.ts).
 *
 * Single column on phones, two columns from `md` up — a form with 10+
 * fields (common for a real contract template) reads as one long scroll
 * on mobile either way, so single-column there is still the right call;
 * two columns is purely a desktop/tablet space win. Multi-choice fields
 * with more than a few options span both columns so the dropdown/options
 * don't fight a narrow half-width column.
 */
export function DynamicDocForm({ fields, values, onChange, language }: DynamicDocFormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {fields.map((f) => {
        const wide = f.type === 'choice' && (f.options?.length ?? 0) > 3;
        return (
          <div key={f.key} className={wide ? 'md:col-span-2' : undefined}>
            <label className="mb-1 block text-xs font-bold text-slate-600">
              {f.label}
              {f.required && <span className="text-red-500"> *</span>}
            </label>
            {f.type === 'choice' ? (
              <select
                value={values[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
              >
                <option value="">{language === 'en' ? 'Select...' : 'Selecciona...'}</option>
                {(f.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input
                type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                value={values[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
