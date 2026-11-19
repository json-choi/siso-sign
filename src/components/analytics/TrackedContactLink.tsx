'use client';

import type { ReactNode } from 'react';

interface TrackedContactLinkProps {
  /** Short lowercase name such as phone, email, instagram or kakaotalk. */
  channel: string;
  target?: string;
  rel?: string;
  children: ReactNode;
  className?: string;
  href: string;
}

export default function TrackedContactLink({
  channel,
  children,
  className,
  href,
  target,
  rel,
}: TrackedContactLinkProps) {
  const handleClick = () => {
    window.fbq?.('track', 'Contact', { content_name: channel });
    // Counted in the admin's visitor analytics; sendBeacon survives leaving the page.
    const body = JSON.stringify({ channel });
    try {
      if (!navigator.sendBeacon?.('/api/collect', new Blob([body], { type: 'application/json' }))) {
        void fetch('/api/collect', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => undefined);
      }
    } catch {
      // Analytics must never block the visitor's click.
    }
  };

  return (
    <a href={href} className={className} onClick={handleClick} target={target} rel={rel}>
      {children}
    </a>
  );
}
