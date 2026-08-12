/**
 * Frontera de errores con el mensaje a la vista.
 *
 * La que ya había (RouteErrorBoundary) tumba la ruta entera y muestra
 * «Ocurrió un inconveniente», que para el usuario está bien pero para arreglar
 * el fallo no sirve de nada: no dice qué pasó, en qué componente, ni en qué
 * versión del código. Un informe de «se rompió» sin ese dato obliga a adivinar.
 *
 * Ésta hace tres cosas distintas:
 *
 * 1. Acota el daño. Envuelve una sección, no toda la aplicación, así que un
 *    fallo en un panel deja el resto de la pantalla en pie.
 * 2. Enseña el error de verdad, plegado, con un botón para copiarlo. Quien lo
 *    sufre puede mandarlo tal cual.
 * 3. Deja reintentar sin recargar: se limpia el estado y se vuelve a montar.
 *    Muchos fallos son de un dato concreto y desaparecen al reintentar.
 *
 * Tiene que ser una clase: `componentDidCatch` no existe en los hooks, y no
 * hay equivalente con función.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Qué parte de la aplicación es, para saberlo al leer el informe. */
  zona: string;
}

interface State {
  error: Error | null;
  pila: string;
  copiado: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, pila: '', copiado: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // El árbol de componentes es lo que dice DÓNDE reventó. El mensaje solo
    // dice qué, y el mismo mensaje puede venir de tres sitios distintos.
    this.setState({ pila: info.componentStack ?? '' });
    console.error(`[${this.props.zona}]`, error, info.componentStack);
  }

  private get informe(): string {
    const { error, pila } = this.state;
    return [
      `Zona: ${this.props.zona}`,
      `Error: ${error?.name}: ${error?.message}`,
      `Ruta: ${typeof window !== 'undefined' ? window.location.pathname : ''}`,
      `Fecha: ${new Date().toISOString()}`,
      '',
      error?.stack ?? '',
      '',
      'Componentes:',
      pila,
    ].join('\n');
  }

  private copiar = () => {
    void navigator.clipboard.writeText(this.informe).then(
      () => {
        this.setState({ copiado: true });
        setTimeout(() => this.setState({ copiado: false }), 2500);
      },
      () => { /* sin portapapeles: el texto sigue visible para seleccionarlo */ },
    );
  };

  private reintentar = () => this.setState({ error: null, pila: '', copiado: false });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-rose-100">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50">
            <AlertTriangle className="size-4.5 text-rose-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-900">Esta sección falló</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              El resto de la página sigue funcionando. Puedes reintentar sin perder
              la sesión; si vuelve a pasar, copia el detalle y mándalo.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={this.reintentar}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-slate-700"
              >
                <RotateCcw className="size-3.5" /> Reintentar
              </button>
              <button
                type="button"
                onClick={this.copiar}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                {this.state.copiado
                  ? <><Check className="size-3.5 text-emerald-600" /> Copiado</>
                  : <><Copy className="size-3.5" /> Copiar detalle</>}
              </button>
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-semibold text-slate-400 transition hover:text-slate-600">
                Ver detalle técnico
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-900 p-3 text-[10px] leading-relaxed text-slate-200">
                {this.informe}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  }
}
