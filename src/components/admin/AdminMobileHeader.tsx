'use client';

import { Menu, X } from 'lucide-react';
import { useSidebar } from './AdminSidebarContext';

export default function AdminMobileHeader() {
  const { isOpen, toggle } = useSidebar();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-[#111] border-b border-white/10 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-white">siso-sign</h1>
        <span className="text-xs text-gray-500">Admin</span>
      </div>
      <button
        onClick={toggle}
        className="p-2 text-gray-400 hover:text-white transition-colors"
        aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </header>
  );
}
