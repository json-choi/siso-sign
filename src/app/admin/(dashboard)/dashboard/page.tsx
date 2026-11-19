import Link from 'next/link';
import { env } from 'cloudflare:workers';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Briefcase, FileText, Images, Link as LinkIcon, Minus, Plus, Settings } from 'lucide-react';
import VisitsChart from '@/components/admin/analytics/VisitsChart';
import { ButtonLink, PageHeader } from '@/components/admin/ui';
import { summarize } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { createAdminDb } from '@/lib/database';
import { PROJECT_TYPE_LABELS, toProjectType } from '@/lib/project-types';
import type { AnalyticsSummary, Ranked } from '@/lib/analytics';
import type { Portfolio } from '@/types/database';

const RANGES = [7, 30, 90] as const;
type PageProps = { searchParams: Promise<{ range?: string }> };

const SOURCE_LABELS: Record<string, string> = {
  direct: '직접 방문 · 북마크',
  instagram: '인스타그램',
  ig: '인스타그램 (광고)',
  facebook: '페이스북',
  fb: '페이스북 (광고)',
  naver: '네이버',
  google: '구글',
  kakao: '카카오 · 다음',
  youtube: '유튜브',
  bing: 'Bing',
};
const DEVICE_LABELS: Record<string, string> = { mobile: '모바일', desktop: 'PC', tablet: '태블릿' };
const DEVICE_COLORS: Record<string, string> = { mobile: '#3987e5', desktop: '#d95926', tablet: '#199e70' };
const CHANNEL_LABELS: Record<string, string> = { phone: '전화', email: '이메일', instagram: '인스타그램', kakaotalk: '카카오톡', blog: '블로그' };
const PAGE_LABELS: Record<string, string> = { '/': '홈', '/work': '포트폴리오', '/about': 'About', '/service': '서비스', '/contact': '문의' };

async function loadStats(days: number): Promise<{ analytics: AnalyticsSummary | null; portfolios: Portfolio[] }> {
  const [analytics, portfolios] = await Promise.all([
    summarize(env.DB, days).catch((error: unknown) => {
      console.error('analytics summary failed', error);
      return null;
    }),
    createAdminDb().from('portfolios').select('*'),
  ]);
  return { analytics, portfolios: portfolios.data ?? [] };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { range } = await searchParams;
  const days = RANGES.find((value) => String(value) === range) ?? 7;
  const { analytics, portfolios } = await loadStats(days);

  const titles = new Map(portfolios.map((item) => [`/work/${item.id}`, item.title]));
  const pageName = (path: string) => PAGE_LABELS[path] ?? titles.get(path) ?? path;
  const types = portfolios.map((row) => toProjectType(row.project_type));
  const unclassified = types.filter((type) => type === null).length;

  return (
    <div>
      <PageHeader
        title="대시보드"
        description="사이트 방문과 문의 흐름을 확인하세요."
        actions={
          <ButtonLink href="/admin/portfolios/new" variant="primary">
            <Plus className="h-4 w-4" />
            새 프로젝트
          </ButtonLink>
        }
      />

      <section aria-labelledby="visits-title" className="rounded-2xl border border-white/10 bg-[#121212] p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="visits-title" className="text-base font-semibold text-white">방문자 분석</h2>
            {analytics && <p className="mt-0.5 text-xs text-gray-500">{analytics.from.replaceAll('-', '.')} – {analytics.to.replaceAll('-', '.')} · 한국 시간 기준</p>}
          </div>
          <nav className="flex rounded-lg bg-white/[0.05] p-1" aria-label="기간">
            {RANGES.map((value) => (
              <Link
                key={value}
                href={`/admin/dashboard?range=${value}`}
                scroll={false}
                aria-current={value === days ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  value === days ? 'bg-white/10 font-medium text-white' : 'text-gray-400 hover:text-white',
                )}
              >
                {value}일
              </Link>
            ))}
          </nav>
        </div>

        {!analytics ? (
          <p className="py-10 text-center text-sm text-gray-500">방문 기록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Kpi label="방문자" value={analytics.visitors} previous={analytics.previous.visitors} hint="하루 단위로 센 방문자 수의 합" />
              <Kpi label="페이지뷰" value={analytics.views} previous={analytics.previous.views} />
              <Kpi label="연락 클릭" value={analytics.contacts} previous={analytics.previous.contacts} hint="전화·이메일·SNS 링크 클릭" />
            </div>

            {analytics.views === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-gray-500">
                아직 이 기간의 방문 기록이 없습니다. 방문 기록은 이 기능을 배포한 때부터 쌓입니다.
              </p>
            ) : (
              <div className="mt-6">
                <VisitsChart data={analytics.daily} />
              </div>
            )}
          </>
        )}
      </section>

      {analytics && analytics.views > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RankCard title="유입 경로" note="방문자 기준 · 사이트 안 이동 제외" items={analytics.sources} name={(key) => SOURCE_LABELS[key] ?? key} />
          <RankCard title="많이 본 페이지" note="페이지뷰 기준" items={analytics.pages} name={pageName} />
          <DeviceCard items={analytics.devices} />
          <RankCard
            title="연락 클릭"
            note="어떤 연락 수단을 눌렀는지"
            items={analytics.contactChannels}
            name={(key) => CHANNEL_LABELS[key] ?? key}
            empty="아직 연락 클릭이 없습니다."
          />
        </div>
      )}

      <Link
        href="/admin/portfolios"
        className="group mt-4 block rounded-2xl border border-white/10 bg-[#121212] p-4 transition-colors hover:border-white/20 md:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 font-semibold text-white">
            <Images className="h-4 w-4 text-gray-400" />
            포트폴리오 {portfolios.length}개
          </p>
          <ArrowRight className="h-5 w-5 text-gray-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <TypeStat label={PROJECT_TYPE_LABELS.commercial} short="Commercial" value={types.filter((type) => type === 'commercial').length} />
          <TypeStat label={PROJECT_TYPE_LABELS.retail} short="Retail" value={types.filter((type) => type === 'retail').length} />
          <TypeStat label="미분류" short="미분류" value={unclassified} />
        </div>
        {unclassified > 0 && <p className="mt-3 text-sm text-amber-400/90">분류되지 않은 프로젝트가 {unclassified}개 있습니다.</p>}
      </Link>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { href: '/admin/services', label: '서비스', icon: Briefcase },
          { href: '/admin/about', label: 'About 페이지', icon: FileText },
          { href: '/admin/settings', label: '사이트 설정', icon: Settings },
          { href: '/admin/links', label: '소셜 링크', icon: LinkIcon },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#121212] p-4 text-sm font-medium text-white transition-colors hover:border-white/20">
              <Icon className="h-4 w-4 shrink-0 text-gray-400" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Kpi({ label, value, previous, hint }: { label: string; value: number; previous: number; hint?: string }) {
  const change = previous === 0 ? null : Math.round(((value - previous) / previous) * 100);
  const Icon = change === null || change === 0 ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="min-w-0 rounded-xl bg-black/30 p-3 sm:p-4" title={hint}>
      <p className="truncate text-xs text-gray-400 sm:text-sm">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-white sm:text-3xl">{value.toLocaleString('ko-KR')}</p>
      <p className={cn('mt-1 flex items-center gap-0.5 text-[11px] sm:text-xs', change === null || change === 0 ? 'text-gray-500' : change > 0 ? 'text-[#4cc24c]' : 'text-[#e66767]')}>
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">
          {change === null ? (
            <>기록 없음<span className="hidden sm:inline"> (이전 기간)</span></>
          ) : (
            <>{`${change > 0 ? '+' : ''}${change}%`}<span className="hidden sm:inline"> 이전 기간 대비</span></>
          )}
        </span>
      </p>
    </div>
  );
}

function RankCard({ title, note, items, name, empty = '기록이 없습니다.' }: { title: string; note: string; items: Ranked[]; name: (key: string) => string; empty?: string }) {
  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <section className="rounded-2xl border border-white/10 bg-[#121212] p-4 md:p-5">
      <h2 className="font-semibold text-white">{title}</h2>
      <p className="mt-0.5 text-xs text-gray-500">{note}</p>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">{empty}</p>
      ) : (
        <ol className="mt-4 space-y-1.5">
          {items.map((item) => (
            <li key={item.key} className="relative overflow-hidden rounded-lg px-3 py-2">
              <span className="absolute inset-y-0 left-0 rounded-lg bg-[#e0336b]/15" style={{ width: `${(item.count / max) * 100}%` }} aria-hidden />
              <span className="relative flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-gray-200">{name(item.key)}</span>
                <span className="shrink-0 tabular-nums font-medium text-white">{item.count.toLocaleString('ko-KR')}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function DeviceCard({ items }: { items: Ranked[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1;
  const ordered = ['mobile', 'desktop', 'tablet'].map((key) => ({ key, count: items.find((item) => item.key === key)?.count ?? 0 })).filter((item) => item.count > 0);
  return (
    <section className="rounded-2xl border border-white/10 bg-[#121212] p-4 md:p-5">
      <h2 className="font-semibold text-white">기기</h2>
      <p className="mt-0.5 text-xs text-gray-500">방문자 기준</p>
      <div className="mt-5 flex h-3 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={ordered.map((item) => `${DEVICE_LABELS[item.key]} ${Math.round((item.count / total) * 100)}%`).join(', ')}>
        {ordered.map((item) => (
          <span key={item.key} style={{ width: `${(item.count / total) * 100}%`, backgroundColor: DEVICE_COLORS[item.key] }} />
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {ordered.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-gray-200">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: DEVICE_COLORS[item.key] }} aria-hidden />
              {DEVICE_LABELS[item.key]}
            </span>
            <span className="tabular-nums text-white">
              {Math.round((item.count / total) * 100)}%<span className="ml-2 text-xs text-gray-500">{item.count.toLocaleString('ko-KR')}명</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TypeStat({ label, short, value }: { label: string; short: string; value: number }) {
  return (
    <div className="min-w-0 rounded-xl bg-black/30 px-3 py-2.5">
      <p className="truncate text-xs text-gray-400" title={label}>
        <span className="sm:hidden">{short}</span>
        <span className="hidden sm:inline">{label}</span>
      </p>
      <p className="mt-0.5 font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}
