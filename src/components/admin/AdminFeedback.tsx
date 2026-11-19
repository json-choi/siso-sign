'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from '@/components/admin/Modal';
import { Button } from '@/components/admin/ui';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface ToastItem {
  id: number;
  tone: 'success' | 'error';
  message: string;
}

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface FeedbackContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback must be used inside FeedbackProvider');
  return context;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const nextId = useRef(0);

  const push = useCallback((tone: ToastItem['tone'], message: string) => {
    const id = ++nextId.current;
    setToasts((current) => [...current.slice(-2), { id, tone, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), tone === 'error' ? 5000 : 2500);
  }, []);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setPending(null);
  }, []);

  const value = useMemo<FeedbackContextValue>(() => ({
    success: (message) => push('success', message),
    error: (message) => push('error', message),
    confirm: (options) => {
      resolver.current?.(false);
      setPending(options);
      return new Promise<boolean>((resolve) => { resolver.current = resolve; });
    },
  }), [push]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur animate-[sheet-in_200ms_ease-out]',
              toast.tone === 'success' ? 'border-emerald-500/20 bg-[#0f1a14]/95 text-emerald-200' : 'border-red-500/25 bg-[#1f0f12]/95 text-red-200',
            )}
          >
            {toast.tone === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <Modal
        open={pending !== null}
        onClose={() => settle(false)}
        title={pending?.title}
        size="sm"
        footer={
          <>
            <Button className="flex-1" onClick={() => settle(false)}>취소</Button>
            <Button className="flex-1" variant={pending?.danger ? 'danger' : 'primary'} onClick={() => settle(true)}>
              {pending?.confirmLabel ?? '확인'}
            </Button>
          </>
        }
      >
        {pending?.description && <p className="text-sm text-gray-400">{pending.description}</p>}
      </Modal>
    </FeedbackContext.Provider>
  );
}
