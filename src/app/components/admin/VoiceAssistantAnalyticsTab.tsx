import { useEffect, useState } from 'react';
import { Mic, Repeat2, AlertTriangle, Users2, Clock } from 'lucide-react';
import {
  fetchVoiceAssistantSummary, fetchVoiceAssistantByStep,
  type VoiceAssistantSummary, type VoiceAssistantStepStats,
} from '../../services/voice-assistant-analytics-service';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>{children}</div>;
}

function StatTile({ icon: Icon, label, value, accent }: {
  icon: typeof Mic; label: string; value: string | null; accent: string;
}) {
  return (
    <Card>
      <div className="flex size-10 items-center justify-center rounded-2xl" style={{ background: `${accent}18` }}>
        <Icon className="size-5" style={{ color: accent }} />
      </div>
      {value === null ? (
        <div className="mt-4 h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="mt-4 text-2xl font-black text-slate-900">{value}</p>
      )}
      <p className="mt-1 text-xs font-medium text-slate-400">{label}</p>
    </Card>
  );
}

const FLOW_LABELS: Record<string, { en: string; es: string }> = {
  'electronic-signature': { en: 'Creator (e-signature)', es: 'Creador (firma electrónica)' },
  'guest-sign': { en: 'Guest (signing link)', es: 'Invitado (enlace de firma)' },
};

const STEP_LABELS: Record<string, { en: string; es: string }> = {
  upload: { en: 'Upload document', es: 'Subir documento' },
  'creator-sign': { en: 'Draw signature', es: 'Trazar firma' },
  'position-creator': { en: 'Place signature', es: 'Colocar firma' },
  'invite-guest': { en: 'Invite guest', es: 'Invitar firmante' },
  'await-guest': { en: 'Awaiting guest', es: 'Esperando invitado' },
  position: { en: 'Position signatures', es: 'Colocar firmas' },
  compiling: { en: 'Compiling', es: 'Compilando' },
  done: { en: 'Done', es: 'Completado' },
  'welcome-review': { en: 'Welcome + review', es: 'Bienvenida + revisión' },
  'ready-to-sign': { en: 'Ready to sign', es: 'Listo para firmar' },
  'identity-gate': { en: 'ID/selfie verification', es: 'Verificación ID/selfie' },
  'draw-signature': { en: 'Draw signature', es: 'Trazar firma' },
  'place-signature': { en: 'Place signature', es: 'Colocar firma' },
  'confirm-signature': { en: 'Confirm signature', es: 'Confirmar firma' },
  signing: { en: 'Signing', es: 'Firmando' },
};

function formatSeconds(s: number | null, language: 'en' | 'es'): string {
  if (s === null) return '—';
  if (s < 60) return `${Math.round(s)}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

export function VoiceAssistantAnalyticsTab({ language }: { language: 'en' | 'es' }) {
  const [summary, setSummary] = useState<VoiceAssistantSummary | null>(null);
  const [steps, setSteps] = useState<VoiceAssistantStepStats[] | null>(null);
  const [daysLimit, setDaysLimit] = useState<7 | 30>(30);

  useEffect(() => {
    fetchVoiceAssistantSummary(daysLimit).then(setSummary).catch(() => setSummary({
      totalPlays: 0, autoPlays: 0, replayButtonPlays: 0, idleHintPlays: 0, stuckHintPlays: 0, uniqueSessions: 0,
    }));
    fetchVoiceAssistantByStep(daysLimit).then(setSteps).catch(() => setSteps([]));
  }, [daysLimit]);

  const flows = Array.from(new Set((steps ?? []).map((s) => s.flow)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Mic className="size-4 text-slate-400" />
          {language === 'en' ? 'Voice Assistant' : 'Asistente de Voz'}
        </h2>
        <div className="flex gap-1 rounded-full bg-slate-50 p-1">
          {[7, 30].map((d) => (
            <button key={d} type="button" onClick={() => setDaysLimit(d as 7 | 30)}
              className="rounded-full px-2.5 py-1 text-[11px] font-bold transition"
              style={daysLimit === d ? { background: '#2563EB', color: '#fff' } : { color: '#64748B' }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-5">
        <StatTile icon={Mic} accent="#4F46E5" label={language === 'en' ? 'Total plays' : 'Reproducciones totales'}
          value={summary ? String(summary.totalPlays) : null} />
        <StatTile icon={Repeat2} accent="#0891B2" label={language === 'en' ? 'Replay button taps' : 'Toques en Escuchar de nuevo'}
          value={summary ? String(summary.replayButtonPlays) : null} />
        <StatTile icon={AlertTriangle} accent="#F59E0B" label={language === 'en' ? 'Idle hints' : 'Ayudas por inactividad'}
          value={summary ? String(summary.idleHintPlays) : null} />
        <StatTile icon={Clock} accent="#DC2626" label={language === 'en' ? 'Stuck hints' : 'Ayudas por estancamiento'}
          value={summary ? String(summary.stuckHintPlays) : null} />
        <StatTile icon={Users2} accent="#16A34A" label={language === 'en' ? 'Unique sessions' : 'Sesiones únicas'}
          value={summary ? String(summary.uniqueSessions) : null} />
      </div>

      {flows.map((flow) => (
        <Card key={flow}>
          <h3 className="text-sm font-black text-slate-900">
            {FLOW_LABELS[flow]?.[language] ?? flow}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {language === 'en' ? 'Plays, drop-off, and average time per step — this is where to look for confusing steps.' : 'Reproducciones, abandono y tiempo promedio por paso — aquí se ve qué paso genera más dudas.'}
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="text-slate-400">
                  <th className="pb-2 font-semibold">{language === 'en' ? 'Step' : 'Paso'}</th>
                  <th className="pb-2 font-semibold">{language === 'en' ? 'Plays' : 'Reproducciones'}</th>
                  <th className="pb-2 font-semibold">{language === 'en' ? 'Reached' : 'Llegaron'}</th>
                  <th className="pb-2 font-semibold">{language === 'en' ? 'Abandoned here' : 'Abandonaron aquí'}</th>
                  <th className="pb-2 font-semibold">{language === 'en' ? 'Avg. time' : 'Tiempo prom.'}</th>
                </tr>
              </thead>
              <tbody>
                {(steps ?? []).filter((s) => s.flow === flow).map((s) => {
                  const abandonPct = s.sessionsReached > 0 ? Math.round((s.sessionsAbandoned / s.sessionsReached) * 100) : 0;
                  return (
                    <tr key={s.step} className="border-t border-slate-50">
                      <td className="py-2 pr-2 font-semibold text-slate-700">{STEP_LABELS[s.step]?.[language] ?? s.step}</td>
                      <td className="py-2 pr-2 text-slate-600">{s.plays}</td>
                      <td className="py-2 pr-2 text-slate-600">{s.sessionsReached}</td>
                      <td className="py-2 pr-2">
                        <span className={`font-bold ${abandonPct >= 30 ? 'text-red-600' : abandonPct >= 15 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {s.sessionsAbandoned} ({abandonPct}%)
                        </span>
                      </td>
                      <td className="py-2 pr-2 text-slate-500">{formatSeconds(s.avgSecondsOnStep, language)}</td>
                    </tr>
                  );
                })}
                {!steps || steps.filter((s) => s.flow === flow).length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-400">{!steps ? (language === 'en' ? 'Loading…' : 'Cargando…') : (language === 'en' ? 'No data yet' : 'Aún sin datos')}</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {steps && flows.length === 0 && (
        <Card>
          <p className="py-6 text-center text-xs text-slate-400">
            {language === 'en' ? 'No voice assistant activity recorded yet.' : 'Aún no hay actividad registrada del asistente de voz.'}
          </p>
        </Card>
      )}
    </div>
  );
}
