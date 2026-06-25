import { Check, Clock, Loader } from 'lucide-react';

export type TimelineStep =
  | 'upload'
  | 'creator-sign'
  | 'invite-guest'
  | 'await-guest'
  | 'position'
  | 'compiling'
  | 'done';

interface SignatureTimelineProps {
  step: TimelineStep;
}

type StepState = 'done' | 'active' | 'pending';

const STEPS: Array<{ id: TimelineStep | string; label: string }> = [
  { id: 'upload', label: 'Documento cargado' },
  { id: 'creator-sign', label: 'Primer firmante' },
  { id: 'invite-guest', label: 'Invitado añadido' },
  { id: 'await-guest', label: 'Segundo firmante' },
  { id: 'position', label: 'Posiciones confirmadas' },
  { id: 'done', label: 'Documento certificado' },
];

const ORDER: TimelineStep[] = [
  'upload',
  'creator-sign',
  'invite-guest',
  'await-guest',
  'position',
  'compiling',
  'done',
];

function getState(stepId: string, currentStep: TimelineStep): StepState {
  const currentIdx = ORDER.indexOf(currentStep);
  const stepIdx = ORDER.indexOf(stepId as TimelineStep);
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

export function SignatureTimeline({ step }: SignatureTimelineProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-900">Progreso del documento</p>
      <ol className="space-y-2.5">
        {STEPS.map(({ id, label }) => {
          const state = getState(id, step);
          return (
            <li key={id} className="flex items-center gap-2.5">
              <span
                className={[
                  'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px]',
                  state === 'done'
                    ? 'bg-emerald-500 text-white'
                    : state === 'active'
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-300 bg-slate-100 text-slate-400',
                ].join(' ')}
              >
                {state === 'done' ? (
                  <Check className="size-3" />
                ) : state === 'active' ? (
                  step === 'compiling' ? (
                    <Loader className="size-3 animate-spin" />
                  ) : (
                    <Clock className="size-3" />
                  )
                ) : (
                  '○'
                )}
              </span>
              <span
                className={[
                  'text-sm',
                  state === 'done'
                    ? 'font-medium text-emerald-700'
                    : state === 'active'
                      ? 'font-semibold text-indigo-700'
                      : 'text-slate-400',
                ].join(' ')}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
