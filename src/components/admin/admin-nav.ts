import { LayoutDashboard, Images, Briefcase, FileText, Settings, Link as LinkIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: '',
    items: [{ href: '/admin/dashboard', label: '대시보드', icon: LayoutDashboard }],
  },
  {
    label: '콘텐츠',
    items: [
      { href: '/admin/portfolios', label: '포트폴리오', icon: Images },
      { href: '/admin/services', label: '서비스', icon: Briefcase },
      { href: '/admin/about', label: 'About 페이지', icon: FileText },
    ],
  },
  {
    label: '사이트',
    items: [
      { href: '/admin/settings', label: '사이트 설정', icon: Settings },
      { href: '/admin/links', label: '소셜 링크', icon: LinkIcon },
    ],
  },
];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function currentNavItem(pathname: string): NavItem | undefined {
  return navGroups.flatMap((group) => group.items).find((item) => isActive(pathname, item.href));
}
