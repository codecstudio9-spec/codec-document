import { Shield } from 'lucide-react';

interface LogoProps {
  tagline?: string;
  size?: 'sm' | 'md';
  dark?: boolean;
  href?: string;
}

/**
 * Same visual language as the sticky header on the Home page and
 * LandingHeader.tsx — copied here as a single shared source instead of a
 * third hand-written copy, since the mobile app shell needs it too.
 */
export function Logo({ tagline, size = 'md', dark = false, href = '/' }: LogoProps) {
  const boxSize = size === 'sm' ? 'size-8' : 'size-9';
  const iconSize = size === 'sm' ? 'size-4' : 'size-5';
  const wordmarkSize = size === 'sm' ? 'text-sm' : 'text-base';
  const textColor = dark ? 'text-white' : 'text-slate-900';
  const accentColor = dark ? 'text-indigo-400' : 'text-indigo-600';
  const taglineColor = dark ? 'text-white/35' : 'text-slate-400';

  const content = (
    <div className="group flex items-center gap-2.5">
      <div className={`relative flex ${boxSize} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-shadow duration-300 group-hover:shadow-[0_0_28px_rgba(99,102,241,0.7)]`}>
        <Shield className={`${iconSize} text-white`} />
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
      </div>
      <div className="min-w-0">
        <span translate="no" className={`notranslate block ${wordmarkSize} font-black tracking-tight ${textColor}`}>
          Codec <span className={accentColor}>Document</span>
        </span>
        {tagline && (
          <span className={`block text-[10px] font-medium leading-none ${taglineColor}`}>{tagline}</span>
        )}
      </div>
    </div>
  );

  if (!href) return content;
  return <a href={href}>{content}</a>;
}
