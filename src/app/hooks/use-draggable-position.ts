import { useEffect, useRef, useState } from 'react';

/**
 * Deja arrastrar un botón flotante a donde no estorbe, y recuerda dónde lo
 * dejó el usuario (por navegador, entre sesiones).
 *
 * Un toque que no se mueve más de unos pocos píxeles sigue valiendo como clic
 * normal; un arrastre de verdad se traga el clic. Es el mismo truco de
 * «descartar el clic después de un gesto real» que usa `use-long-press.ts`.
 *
 * ── Por qué está aquí y no dentro de un componente ──────────────────────
 * Vivía dentro de `InstallAppPrompt`, que era su único usuario. Al aparecer
 * el segundo botón flotante —la ayuda del panel del contador— la opción era
 * copiarlo o subirlo; copiado, cualquier arreglo del arrastre habría quedado
 * aplicado en la mitad de los sitios.
 */
export function useDraggablePosition(storageKey: string) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const nodoRef = useRef<HTMLElement | null>(null);

  /**
   * Devuelve la posición dentro de la ventana actual.
   *
   * Hace falta porque una posición guardada puede dejar de valer sin que nadie
   * la toque: basta con que el botón crezca —al de ayuda le apareció al lado
   * el de la voz y pasó de 150 a 226 px— o con abrir la misma cuenta en una
   * pantalla más pequeña. En los dos casos el botón aparecía medio fuera de
   * la ventana, y la parte que sobresale no se puede ni pulsar ni arrastrar
   * para recuperarlo.
   */
  const dentroDeLaVentana = (p: { left: number; top: number }, ancho: number, alto: number) => ({
    left: Math.min(Math.max(p.left, 8), Math.max(8, window.innerWidth - ancho - 8)),
    top: Math.min(Math.max(p.top, 8), Math.max(8, window.innerHeight - alto - 8)),
  });

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { left: number; top: number };
      if (typeof parsed.left !== 'number' || typeof parsed.top !== 'number') return;
      setPos(parsed);
    } catch { /* ignore malformed value */ }
  }, [storageKey]);

  /** Recolocar después de pintar —cuando ya se sabe cuánto mide el botón— y
   *  cada vez que cambie el tamaño de la ventana. */
  useEffect(() => {
    const recolocar = () => {
      const nodo = nodoRef.current;
      if (!nodo) return;
      const r = nodo.getBoundingClientRect();
      setPos((actual) => {
        if (!actual) return actual;
        const ajustada = dentroDeLaVentana(actual, r.width, r.height);
        return ajustada.left === actual.left && ajustada.top === actual.top ? actual : ajustada;
      });
    };

    recolocar();
    window.addEventListener('resize', recolocar);
    return () => window.removeEventListener('resize', recolocar);
  }, [pos !== null]);

  /**
   * ── Por qué la captura del puntero NO se pide aquí ─────────────────────
   *
   * Se pedía en `pointerdown`, y eso rompía en silencio todos los botones que
   * viven dentro del elemento arrastrable. Una vez capturado el puntero, la
   * especificación manda los eventos siguientes —incluido el `click`— al
   * elemento que captura, no al que está debajo del cursor: el `click` se
   * disparaba sobre el contenedor y jamás llegaba al botón de dentro. El de la
   * voz, el de la ayuda y la X estaban muertos al ratón, y el de «Instalar
   * app» tenía exactamente el mismo problema.
   *
   * No se detectó antes porque las pruebas llamaban a `.click()` desde
   * JavaScript, que se salta la captura y pasaba en verde. Un clic de persona
   * no.
   *
   * Ahora se captura en el primer movimiento que pasa del umbral, es decir
   * cuando ya se sabe que esto es un arrastre y no un clic. Arrastrar sigue
   * siendo igual de firme —la captura entra en cuanto el gesto empieza de
   * verdad— y pulsar vuelve a funcionar.
   */
  const capturadoRef = useRef<{ nodo: HTMLElement; id: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    nodoRef.current = e.currentTarget;
    draggingRef.current = true;
    movedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;

    if (!movedRef.current) {
      if (Math.hypot(dx, dy) <= 6) return;
      movedRef.current = true;
      // Ahora sí: es un arrastre. Capturar aquí mantiene el gesto pegado al
      // puntero aunque se salga del botón, sin secuestrar los clics.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
        capturadoRef.current = { nodo: e.currentTarget, id: e.pointerId };
      } catch { /* algunos navegadores lo rechazan; el arrastre sigue */ }
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setPos(dentroDeLaVentana(
      { left: startRef.current.left + dx, top: startRef.current.top + dy },
      rect.width,
      rect.height,
    ));
  };

  const onPointerUp = () => {
    draggingRef.current = false;

    const capturado = capturadoRef.current;
    capturadoRef.current = null;
    if (capturado) {
      try { capturado.nodo.releasePointerCapture(capturado.id); } catch { /* ya soltado */ }
    }

    if (movedRef.current) {
      setPos((current) => {
        if (current) localStorage.setItem(storageKey, JSON.stringify(current));
        return current;
      });
    }
  };

  return {
    pos,
    /** Hay que ponerla en el elemento que se arrastra. Sin ella el hook no
     *  sabe cuánto mide hasta el primer arrastre, y no puede comprobar que la
     *  posición guardada siga cabiendo en la ventana. */
    ref: (nodo: HTMLElement | null) => { nodoRef.current = nodo; },
    wasDragged: () => movedRef.current,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
