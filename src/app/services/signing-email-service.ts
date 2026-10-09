import { supabase } from '../../lib/supabase';

async function invokeSigningInvitation(body: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabase.functions.invoke('send-signing-invitation', { body });
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const parsed = await context.clone().json();
        if (parsed?.error) throw new Error(String(parsed.error));
      } catch (parsed) {
        if (parsed instanceof Error && parsed.message) throw parsed;
      }
    }
    throw new Error(error.message);
  }
  if (!data?.sent) throw new Error('El servicio no confirmó el envío del correo');
  return String(data.to ?? '');
}

/** Word-template flow (/sign/:transactionId). */
export async function sendSigningInvitation(transactionId: string, recipientEmail: string): Promise<void> {
  await invokeSigningInvitation({ transactionId, recipientEmail });
}

/** PDF signing flow (/guest-sign/:token). The email goes to the address
 * stored on the signer row; returns it so the UI can say where it went. */
export async function sendGuestSigningInvitation(
  signingToken: string,
  require: { idPhoto?: boolean; selfie?: boolean; biometric?: boolean },
): Promise<string> {
  return invokeSigningInvitation({ signingToken, require });
}
