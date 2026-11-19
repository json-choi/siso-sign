'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ExternalLink, LogOut, X } from 'lucide-react';
import { useSidebar } from '@/components/admin/AdminSidebarContext';
import { isActive, navGroups } from '@/components/admin/admin-nav';
import { cn } from '@/lib/cn';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useSidebar();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' }).catch(() => null);
    router.push('/admin');
    router.refresh();
  };

  return (
    <>
      <div
        className={cn('lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity', isOpen ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={close}
        aria-hidden
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-[#0f0f0f] transition-transform duration-300 ease-out',
          'lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="관리자 메뉴"
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/[0.06]">
          <Link href="/admin/dashboard" onClick={close} className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">S</span>
            <span>
              <span className="block text-sm font-semibold leading-tight text-white">siso-sign</span>
              <span className="block text-xs leading-tight text-gray-500">관리자</span>
            </span>
          </Link>
          <button onClick={close} className="lg:hidden -mr-2 rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white" aria-label="메뉴 닫기">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label || 'main'} className="mb-5">
              {group.label && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">{group.label}</p>}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                          active ? 'bg-white/[0.07] font-medium text-white' : 'text-gray-400 hover:bg-white/[0.04] hover:text-white',
                        )}
                      >
                        {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" aria-hidden />}
                        <Icon className={cn('h-[18px] w-[18px]', active && 'text-primary')} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-0.5 border-t border-white/[0.06] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <ExternalLink className="h-[18px] w-[18px]" />
            사이트 보기
          </a>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-[18px] w-[18px]" />
            로그아웃
          </button>
        </div>
      </aside>
    </>
  );
}
