import { useCallback, useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

// Module-level (not component state) because the browser only ever fires
// `beforeinstallprompt` once per eligible page load, and it must be
// preventDefault()-ed the instant it fires to keep it usable later —
// whichever component mounts first wins the race if this were local state.
// Centralizing it here lets both the floating InstallAppPrompt banner and
// the on-demand "Install app" row in Settings share the same captured
// event instead of each attaching its own listener.
let capturedEvent: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(event: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    capturedEvent = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l(capturedEvent));
  });
  window.addEventListener('appinstalled', () => {
    capturedEvent = null;
    listeners.forEach((l) => l(null));
  });
}

export function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(capturedEvent);

  useEffect(() => {
    listeners.add(setEvent);
    return () => { listeners.delete(setEvent); };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!event) return false;
    event.prompt();
    const choice = await event.userChoice;
    capturedEvent = null;
    listeners.forEach((l) => l(null));
    return choice.outcome === 'accepted';
  }, [event]);

  return {
    /** True once Chrome/Android has handed us a real install prompt we can trigger on demand. */
    canInstall: !!event,
    isIOS: isIOSDevice(),
    isStandalone: isStandaloneDisplay(),
    promptInstall,
  };
}
