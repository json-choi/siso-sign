'use client';

import { useId } from 'react';
import Link from 'next/link';
import { Inbox, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes, ComponentProps, InputHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'icon';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-[#bd0a43] shadow-sm shadow-primary/20',
  secondary: 'bg-white/[0.06] text-white border border-white/10 hover:bg-white/10 hover:border-white/20',
  ghost: 'text-gray-400 hover:text-white hover:bg-white/[0.06]',
  danger: 'bg-red-600 text-white hover:bg-red-500',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  icon: 'h-10 w-10 justify-center',
};

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', className?: string): string {
  return cn(
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]',
    'disabled:opacity-50 disabled:pointer-events-none',
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({ variant, size, loading = false, className, children, disabled, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}

export function PageHeader({ title, description, actions, back }: PageHeaderProps) {
  return (
    <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-2 min-w-0">
        {back}
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-gray-400">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </div>
  );
}

interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Card({ title, description, actions, children, className, id }: CardProps) {
  return (
    <section id={id} className={cn('rounded-2xl border border-white/10 bg-[#121212] scroll-mt-24', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-4 md:px-6">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-white">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-4 md:p-6">{children}</div>
    </section>
  );
}

export const inputClass = cn(
  'w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-base text-white placeholder:text-gray-600',
  'transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25',
);

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  dirty?: boolean;
  children: (id: string) => ReactNode;
}

export function Field({ label, hint, required, dirty, children }: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-primary" aria-hidden>*</span>}
        {dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="저장되지 않은 변경" />}
      </label>
      {children(id)}
      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-lg py-1 text-left disabled:opacity-50"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-white">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-gray-500">{description}</span>}
      </span>
      <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-white/15')}>
        <span className={cn('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
      </span>
    </button>
  );
}

type BadgeTone = 'neutral' | 'success' | 'warning' | 'primary';
const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-white/[0.06] text-gray-400',
  success: 'bg-emerald-500/15 text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-400',
  primary: 'bg-primary/20 text-rose-300',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', badgeTones[tone])}>{children}</span>;
}

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      <Inbox className="mb-3 h-8 w-8 text-gray-600" aria-hidden />
      <p className="font-medium text-white">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="불러오는 중">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-white/[0.06]" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
      <p className="text-sm text-red-300">{message}</p>
      <Button className="mt-4" size="sm" onClick={onRetry}>다시 시도</Button>
    </div>
  );
}

interface SaveBarProps {
  count: number;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

/** Sticky bar for pages that batch unsaved edits. */
export function SaveBar({ count, saving, onSave, onDiscard }: SaveBarProps) {
  if (count === 0) return null;
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-white/10 bg-[#0a0a0a]/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <p className="text-sm text-gray-300">
          <span className="font-semibold text-white">{count}개</span> 항목이 변경되었습니다
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onDiscard} disabled={saving}>되돌리기</Button>
          <Button size="sm" variant="primary" onClick={onSave} loading={saving}>저장</Button>
        </div>
      </div>
    </div>
  );
}
