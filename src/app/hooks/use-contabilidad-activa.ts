import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * ¿Esta persona tiene Contabilidad (plan o prueba)? Para enseñar el acceso en
 * el menú del dashboard sólo a quien paga: a los demás no se les llena el
 * menú con algo que no pueden usar (se les ofrece dentro de Documentos DIAN).
 *
 * Se guarda en sessionStorage por usuario para no preguntarle a la base en
 * cada cambio de pantalla del dashboard.
 */
export function useContabilidadActiva(userId: string | undefined): boolean {
  const clave = userId ? `codec_cont_activa_${userId}` : '';
  const [activa, setActiva] = useState(() => {
    try { return clave ? sessionStorage.getItem(clave) === '1' : false; } catch { return false; }
  });

  useEffect(() => {
    if (!userId) { setActiva(false); return; }
    let vivo = true;
    supabase.rpc('cont_acceso_activo').then(({ data }) => {
      if (!vivo) return;
      const v = data === true;
      setActiva(v);
      try { sessionStorage.setItem(clave, v ? '1' : '0'); } catch { /* da igual */ }
    });
    return () => { vivo = false; };
  }, [userId, clave]);

  return activa;
}
