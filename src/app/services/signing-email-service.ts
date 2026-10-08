import { supabase } from '../../lib/supabase';

export async function sendSigningInvitation(
  transactionId: string,
  recipientEmail: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('send-signing-invitation', {
    body: { transactionId, recipientEmail },
  });
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const body = await context.clone().json();
        if (body?.error) throw new Error(String(body.error));
      } catch (parsed) {
        if (parsed instanceof Error && parsed.message) throw parsed;
      }
    }
    throw new Error(error.message);
  }
  if (!data?.sent) throw new Error('El servicio no confirmó el envío del correo');
}
