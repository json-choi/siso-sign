import Link from 'next/link';
import { ArrowRight, Briefcase, FileText, Images, Link as LinkIcon, Plus, Settings } from 'lucide-react';
import { ButtonLink, PageHeader } from '@/components/admin/ui';
import { createAdminDb } from '@/lib/database';
import { PROJECT_TYPE_LABELS, toProjectType } from '@/lib/project-types';

async function getStats() {
  const db = createAdminDb();
  const [portfolios, services, links] = await Promise.all([
    db.from('portfolios').select('*'),
    db.from('services').select('id', { count: 'exact' }),
    db.from('social_links').select('id', { count: 'exact' }),
  ]);

  const rows = portfolios.data ?? [];
  const types = rows.map((row) => toProjectType(row.project_type));
  return {
    portfolios: rows.length,
    published: rows.filter((row) => row.is_published).length,
    featured: rows.filter((row) => row.is_featured).length,
    commercial: types.filter((type) => type === 'commercial').length,
    retail: types.filter((type) => type === 'retail').length,
    unclassified: types.filter((type) => type === null).length,
    services: services.count ?? 0,
    links: links.count ?? 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const shortcuts = [
    { href: '/admin/services', label: '서비스', detail: `${stats.services}개`, icon: Briefcase },
    { href: '/admin/about', label: 'About 페이지', detail: '소개 · 핵심 가치', icon: FileText },
    { href: '/admin/settings', label: '사이트 설정', detail: '연락처 · 사업자 정보', icon: Settings },
    { href: '/admin/links', label: '소셜 링크', detail: `${stats.links}개`, icon: LinkIcon },
  ];

  return (
    <div>
      <PageHeader
        title="대시보드"
        description="사이트 콘텐츠를 한눈에 확인하세요."
        actions={
          <ButtonLink href="/admin/portfolios/new" variant="primary">
            <Plus className="h-4 w-4" />
            새 프로젝트
          </ButtonLink>
        }
      />

      <Link
        href="/admin/portfolios"
        className="group block rounded-2xl border border-white/10 bg-gradient-to-br from-primary/15 via-[#121212] to-[#121212] p-5 transition-colors hover:border-white/20 md:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm text-gray-400">
              <Images className="h-4 w-4" />
              포트폴리오
            </p>
            <p className="mt-2 text-4xl font-bold text-white">{stats.portfolios}</p>
            <p className="mt-1 text-sm text-gray-500">
              공개 {stats.published} · 추천 {stats.featured}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <TypeStat label={PROJECT_TYPE_LABELS.commercial} value={stats.commercial} />
          <TypeStat label={PROJECT_TYPE_LABELS.retail} value={stats.retail} />
          <TypeStat label="미분류" value={stats.unclassified} muted />
        </div>
        {stats.unclassified > 0 && (
          <p className="mt-4 text-sm text-amber-400/90">
            분류되지 않은 프로젝트가 {stats.unclassified}개 있습니다. 포트폴리오에서 드래그해서 분류하세요.
          </p>
        )}
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#121212] p-4 transition-colors hover:border-white/20"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-gray-300 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-white">{item.label}</span>
                <span className="block truncate text-sm text-gray-500">{item.detail}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function TypeStat({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-black/30 px-4 py-3">
      <span className={muted ? 'text-sm text-gray-500' : 'text-sm text-gray-300'}>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
