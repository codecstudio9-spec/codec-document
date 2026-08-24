import { toast } from 'sonner';

/**
 * Comparte el enlace del formulario EN BLANCO de una plantilla (no un
 * documento ya lleno) — `/generator/:id` no pide sesión ni datos previos
 * (ver comentario "Generator is open to all" en routes.tsx), así que
 * cualquiera que lo abra ve el formulario vacío listo para llenar. Distinto
 * del botón "Compartir" de la pantalla de vista previa, que comparte el PDF
 * ya generado con los datos de ESE documento.
 */
export async function compartirFormularioEnBlanco(templateId: string, name: string, language: string): Promise<void> {
  const url = `${window.location.origin}/generator/${templateId}`;
  const texto = language === 'en' ? `Fill out this ${name} form:` : `Llena este formulario de ${name}:`;

  if (navigator.share) {
    try {
      await navigator.share({ title: name, text: texto, url });
      return;
    } catch {
      // El usuario cerró el panel del sistema sin elegir nada, o el
      // navegador rechazó compartir — cae al portapapeles en vez de fallar.
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success(language === 'en'
      ? 'Link copied — it opens blank for whoever opens it.'
      : 'Enlace copiado — se abre en blanco para quien lo abra.');
  } catch {
    toast.error(language === 'en' ? 'Could not copy the link.' : 'No se pudo copiar el enlace.');
  }
}
