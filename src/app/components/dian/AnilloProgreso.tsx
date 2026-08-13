import { motion } from 'framer-motion';
import { MOV } from '../../styles/contador-theme';

/**
 * Anillo de progreso.
 *
 * ── Por qué un anillo y no una barra ────────────────────────────────────
 * Una barra dice «cuánto llevas». Un anillo con la cifra dentro dice «cuánto
 * llevas Y de cuánto», sin que el ojo tenga que saltar a otro sitio a buscar
 * el total. En un panel donde el contador mira de reojo mientras trabaja, esa
 * diferencia decide si entiende su cupo de un vistazo o no lo mira nunca.
 *
 * ── Detalles que importan ───────────────────────────────────────────────
 * · Empieza arriba (-90°) porque un progreso que arranca a la derecha se lee
 *   mal; nadie mide ángulos, se comparan con un reloj.
 * · El trazo se anima desde 0 al montar. Ver crecer la cifra comunica que se
 *   acaba de calcular, no que estaba ahí de antes.
 * · Si no hay límite, no se dibuja progreso: se pone un anillo completo y
 *   tenue. Un 100 % lleno diría «se te acabó», que es lo contrario.
 */

interface Props {
  /** Consumido. */
  valor: number;
  /** Total. `null` = sin límite. */
  total: number | null;
  /** Diámetro en píxeles. */
  tamano?: number;
  grosor?: number;
  /** Color del trazo. Se decide fuera: quien llama sabe si es alarma o no. */
  color?: string;
  etiqueta?: string;
  /** Texto central. Por defecto, el valor. */
  centro?: string;
}

export function AnilloProgreso({
  valor,
  total,
  tamano = 96,
  grosor = 9,
  color = '#2563EB',
  etiqueta,
  centro,
}: Props) {
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;

  const sinLimite = total === null;
  // Se corta a 1: pasarse del cupo no puede dibujar un anillo dando la vuelta.
  const fraccion = sinLimite ? 0 : Math.min(1, valor / Math.max(1, total));
  const restante = circunferencia * (1 - fraccion);

  const idGrad = `anillo-${color.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: tamano, height: tamano }}>
        <svg width={tamano} height={tamano} className="-rotate-90">
          <defs>
            {/* El degradado hace que el anillo no se lea como un plástico de
                un solo tono; es lo que separa esto de un progreso genérico. */}
            <linearGradient id={idGrad} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.75" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>

          {/* Canal de fondo */}
          <circle
            cx={tamano / 2}
            cy={tamano / 2}
            r={radio}
            fill="none"
            stroke="rgba(15,23,42,0.07)"
            strokeWidth={grosor}
          />

          {sinLimite ? (
            <circle
              cx={tamano / 2}
              cy={tamano / 2}
              r={radio}
              fill="none"
              stroke={`url(#${idGrad})`}
              strokeWidth={grosor}
              strokeLinecap="round"
              opacity={0.35}
            />
          ) : (
            <motion.circle
              cx={tamano / 2}
              cy={tamano / 2}
              r={radio}
              fill="none"
              stroke={`url(#${idGrad})`}
              strokeWidth={grosor}
              strokeLinecap="round"
              strokeDasharray={circunferencia}
              initial={{ strokeDashoffset: circunferencia }}
              animate={{ strokeDashoffset: restante }}
              transition={MOV.lenta}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-black leading-none tabular-nums text-slate-900"
            style={{ fontSize: tamano * 0.22 }}
          >
            {centro ?? (sinLimite ? '∞' : valor.toLocaleString('es-CO'))}
          </span>
          {!sinLimite && total > 0 && (
            <span className="mt-0.5 text-[10px] font-semibold tabular-nums text-slate-400">
              de {total.toLocaleString('es-CO')}
            </span>
          )}
        </div>
      </div>

      {etiqueta && (
        <span className="text-[11px] font-semibold text-slate-500">{etiqueta}</span>
      )}
    </div>
  );
}
