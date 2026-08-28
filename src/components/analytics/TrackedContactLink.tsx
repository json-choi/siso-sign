'use client';

import type { ReactNode } from 'react';

interface TrackedContactLinkProps {
  channel: 'email' | 'phone';
  children: ReactNode;
  className?: string;
  href: string;
}

export default function TrackedContactLink({
  channel,
  children,
  className,
  href,
}: TrackedContactLinkProps) {
  const handleClick = () => {
    window.fbq?.('track', 'Contact', { content_name: channel });
  };

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
