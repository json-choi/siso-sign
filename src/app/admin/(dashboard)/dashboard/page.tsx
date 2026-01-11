import { createAdminClient } from '@/lib/supabase';
import { Images, Briefcase, Settings, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

async function getStats() {
  const supabase = createAdminClient();
  
  const [portfolios, services, settings, links] = await Promise.all([
    supabase.from('portfolios').select('id', { count: 'exact' }),
    supabase.from('services').select('id', { count: 'exact' }),
    supabase.from('site_settings').select('id', { count: 'exact' }),
    supabase.from('social_links').select('id', { count: 'exact' }),
  ]);

  return {
    portfolios: portfolios.count || 0,
    services: services.count || 0,
    settings: settings.count || 0,
    links: links.count || 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: '포트폴리오', count: stats.portfolios, icon: Images, href: '/admin/portfolios', color: 'bg-blue-500' },
    { label: '서비스', count: stats.services, icon: Briefcase, href: '/admin/services', color: 'bg-green-500' },
    { label: '사이트 설정', count: stats.settings, icon: Settings, href: '/admin/settings', color: 'bg-purple-500' },
    { label: '소셜 링크', count: stats.links, icon: LinkIcon, href: '/admin/links', color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">대시보드</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold text-white">{card.count}</span>
              </div>
              <p className="text-gray-400 group-hover:text-white transition-colors">{card.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">빠른 시작</h2>
        <ul className="space-y-3 text-gray-400">
          <li>• <Link href="/admin/portfolios" className="text-primary hover:underline">포트폴리오</Link>에서 새 프로젝트를 추가하세요</li>
          <li>• <Link href="/admin/settings" className="text-primary hover:underline">사이트 설정</Link>에서 회사 정보를 수정하세요</li>
          <li>• <Link href="/admin/services" className="text-primary hover:underline">서비스</Link> 목록을 관리하세요</li>
          <li>• <Link href="/admin/links" className="text-primary hover:underline">소셜 링크</Link>를 추가하세요</li>
        </ul>
      </div>
    </div>
  );
}
