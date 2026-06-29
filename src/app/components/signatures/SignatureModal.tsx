import { useEffect } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck } from 'lucide-react';
import { SignaturePad } from './SignaturePad';

interface SignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (signatureDataUrl: string) => void;
  signerName?: string;
  title?: string;
  subtitle?: string;
  userId?: string;
}

export function SignatureModal({
  open,
  onOpenChange,
  onConfirm,
  signerName = '',
  title = 'Firma electrónica',
  subtitle,
  userId,
}: SignatureModalProps) {
  const { user, isAdmin } = useAuth();
  useEffect(() => {
    if (!open) return;
    try { console.log('USER', user); console.log('IS_ADMIN', isAdmin); console.log('PERMISSIONS', (user as any)?.permissions || null); } catch {}
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="sig-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => onOpenChange(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(2, 6, 23, 0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <motion.div
            key="sig-card"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              borderRadius: '28px',
              background: '#ffffff',
              boxShadow: '0 40px 80px -16px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* ── Header ── */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 45%, #2563eb 100%)',
                padding: '22px 24px 20px',
                borderRadius: '28px 28px 0 0',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Left: icon + text */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ShieldCheck size={20} color="#ffffff" />
                  </div>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#ffffff',
                        lineHeight: 1.25,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {title}
                    </p>
                    {subtitle && (
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.6)',
                          lineHeight: 1.3,
                        }}
                      >
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: close button */}
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'; }}
                >
                  <X size={16} color="#ffffff" />
                </button>
              </div>

              {/* Shimmer line at bottom of header */}
              <div
                style={{
                  marginTop: 18,
                  height: 1,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.30), transparent)',
                }}
              />
            </div>

            {/* ── Body ── */}
            <div
              style={{
                maxHeight: '62vh',
                overflowY: 'auto',
                padding: '20px 24px 16px',
              }}
            >
              <SignaturePad
                signerName={signerName}
                userId={userId}
                onCancel={() => onOpenChange(false)}
                onConfirm={(dataUrl) => {
                  onConfirm(dataUrl);
                  onOpenChange(false);
                }}
              />
            </div>

            {/* ── Footer compliance strip ── */}
            <div
              style={{
                borderTop: '1px solid #f1f5f9',
                background: '#fafbfd',
                padding: '8px 24px',
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 9,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                ✓ E-SIGN Act · UETA · SHA-256 Encrypted · Tamper-Evident
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
