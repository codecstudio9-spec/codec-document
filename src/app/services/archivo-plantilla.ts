/**
 * Una sola caja de "Sube tu documento" en /my-templates que acepta lo que el
 * cliente tenga a mano —Word, PDF o una foto del contrato— y lo manda al
 * editor que corresponde:
 *
 *   .docx / Google Docs → /my-templates/new-docx (campos detectados solos)
 *   .pdf                → /my-templates/new      (campos con clic sobre el PDF)
 *   .jpg / .png         → se convierte a PDF y va al editor de PDF
 *
 * El archivo viaja al editor por esta variable de módulo y no por el state
 * del router: no hace falta serializarlo, y si la persona recarga el editor
 * simplemente ve la caja de subir de siempre.
 */
import { PDFDocument } from 'pdf-lib';

export type TipoPlantilla = 'docx' | 'pdf';

let pendiente: { tipo: TipoPlantilla; file: File } | null = null;

/** El editor lo toma una sola vez al abrir; después queda vacío. */
export function tomarArchivoPendiente(tipo: TipoPlantilla): File | null {
  if (!pendiente || pendiente.tipo !== tipo) return null;
  const { file } = pendiente;
  pendiente = null;
  return file;
}

export const ACCEPT_CUALQUIER_DOCUMENTO =
  '.docx,.pdf,.doc,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,image/jpeg,image/png';

async function imagenAPdf(file: File): Promise<File> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await PDFDocument.create();
  const esPng = file.type === 'image/png' || /\.png$/i.test(file.name);
  const img = esPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
  // Tamaño carta, la foto ajustada al ancho con margen.
  const ancho = 612, alto = 792, margen = 36;
  const escala = Math.min((ancho - margen * 2) / img.width, (alto - margen * 2) / img.height);
  const w = img.width * escala, h = img.height * escala;
  pdf.addPage([ancho, alto]).drawImage(img, { x: (ancho - w) / 2, y: alto - margen - h, width: w, height: h });
  const out = await pdf.save();
  return new File([out], file.name.replace(/\.(jpe?g|png)$/i, '') + '.pdf', { type: 'application/pdf' });
}

/**
 * Decide a qué editor va el archivo y lo deja listo para él. Devuelve la ruta
 * a la que hay que navegar, o lanza un Error con un mensaje para el cliente.
 */
export async function prepararArchivoPlantilla(file: File, language: 'en' | 'es'): Promise<string> {
  const nombre = file.name.toLowerCase();
  const es = language === 'es';

  if (nombre.endsWith('.docx') || file.type.includes('wordprocessingml')) {
    pendiente = { tipo: 'docx', file };
    return '/my-templates/new-docx';
  }
  if (nombre.endsWith('.pdf') || file.type === 'application/pdf') {
    pendiente = { tipo: 'pdf', file };
    return '/my-templates/new';
  }
  if (/\.(jpe?g|png)$/.test(nombre) || file.type === 'image/jpeg' || file.type === 'image/png') {
    try {
      pendiente = { tipo: 'pdf', file: await imagenAPdf(file) };
    } catch {
      throw new Error(es ? 'No pudimos leer esta imagen. Prueba con otra foto o con un PDF.' : "We couldn't read this image. Try another photo or a PDF.");
    }
    return '/my-templates/new';
  }
  if (nombre.endsWith('.doc') || file.type === 'application/msword') {
    throw new Error(es
      ? 'Este Word es de una versión antigua (.doc). Ábrelo en Word y usa «Guardar como» → .docx, y vuelve a subirlo.'
      : 'This is an old Word file (.doc). Open it in Word, use "Save as" → .docx, and upload it again.');
  }
  throw new Error(es
    ? 'Ese tipo de archivo no se puede usar. Sube un Word (.docx), un PDF o una foto (JPG o PNG).'
    : "That file type can't be used. Upload a Word file (.docx), a PDF, or a photo (JPG or PNG).");
}
