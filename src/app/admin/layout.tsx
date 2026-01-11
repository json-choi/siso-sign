import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | siso-sign',
  description: 'siso-sign 관리자 페이지',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
