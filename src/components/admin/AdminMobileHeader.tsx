'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/components/admin/AdminSidebarContext';
import { currentNavItem } from '@/components/admin/admin-nav';

export default function AdminMobileHeader() {
  const { isOpen, open } = useSidebar();
  const pathname = usePathname();
  const current = currentNavItem(pathname);

  return (
    <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-white/10 bg-[#0a0a0a]/90 px-2 backdrop-blur pt-[env(safe-area-inset-top)]">
      <button
        onClick={open}
        className="rounded-lg p-2.5 text-gray-300 hover:bg-white/5 hover:text-white"
        aria-label="메뉴 열기"
        aria-expanded={isOpen}
      >
        <Menu className="h-5 w-5" />
      </button>
      <p className="truncate text-sm font-semibold text-white">{current?.label ?? '관리자'}</p>
    </header>
  );
}
