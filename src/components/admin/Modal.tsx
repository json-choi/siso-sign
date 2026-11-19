'use client';

import { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'lg';
}

/** Centered dialog on desktop, bottom sheet on phones. */
export default function Modal({ open, onClose, title, children, footer, size = 'lg' }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fade-in_150ms_ease-out]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-white/10 bg-[#141414] shadow-2xl sm:rounded-2xl',
          'animate-[sheet-in_200ms_ease-out]',
          size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-lg',
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/15 sm:hidden" aria-hidden />
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 sm:pt-5">
          <h2 id={titleId} className="text-lg font-semibold text-white">{title}</h2>
          <button type="button" onClick={onClose} className="-mr-2 rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white" aria-label="닫기">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && (
          <footer className="flex gap-2 border-t border-white/[0.06] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
