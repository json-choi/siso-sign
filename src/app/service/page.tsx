import { Metadata } from 'next';
import { Palette, Layout, Frame, PenTool, Layers, Box, Monitor, Type } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RichContent from '@/components/RichContent';
import type { Service } from '@/types/database';

export const metadata: Metadata = {
  title: 'Service | siso-sign',
  description: '시소사인의 전문 서비스 - 브랜딩, 사이니지, 전시 디자인',
};

export const revalidate = 0;

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Palette,
  Layout,
  Frame,
  PenTool,
  Layers,
  Box,
  Monitor,
  Type
};

async function getServices() {
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return data || [];
}

const fallbackServices = [
  {
    id: '1',
    title: 'Branding',
    description: '<p>브랜드의 핵심 가치를 시각적으로 구체화하여 독보적인 아이덴티티를 구축합니다. 로고 디자인부터 컬러 시스템, 타이포그래피, 그래픽 모티프까지 일관된 브랜드 경험을 설계합니다.</p>',
    icon: 'Palette'
  },
  {
    id: '2',
    title: 'Signage',
    description: '<p>공간의 특성을 반영한 맞춤형 사인 시스템을 설계하고 제작합니다. 실내외 사인, 웨이파인딩, 디지털 사이니지 등 심미성과 기능성을 겸비한 다양한 솔루션을 제공합니다.</p>',
    icon: 'Layout'
  },
  {
    id: '3',
    title: 'Exhibition',
    description: '<p>전시 공간 디자인부터 그래픽, 설치물, 운영 계획까지 총체적인 전시 경험을 기획하고 구현합니다. 관람객의 동선과 시선을 고려한 최적의 공간 연출을 제안합니다.</p>',
    icon: 'Frame'
  },
];

export default async function ServicePage() {
  let services = await getServices();
  
  if (!services || services.length === 0) {
    services = fallbackServices;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 pb-20 px-6 md:px-12 max-w-[1400px] mx-auto">
        <section className="mb-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Our Services</h1>
          <p className="text-xl text-gray-400">
            공간의 가치를 높이는 전문 서비스를 제공합니다
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service: Service | typeof fallbackServices[number]) => {
            const IconComponent = service.icon && iconMap[service.icon] 
              ? iconMap[service.icon] 
              : Box;

            return (
              <div 
                key={service.id}
                className="border border-white/10 rounded-xl p-8 hover:border-primary transition-colors group flex flex-col h-full"
              >
                <div className="mb-6 text-primary">
                  <IconComponent className="w-10 h-10" />
                </div>
                
                <h2 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                  {service.title}
                </h2>
                
                <div className="text-gray-400 flex-grow">
                  {service.description?.includes('<') ? (
                    <RichContent html={service.description} className="text-gray-400 text-base" />
                  ) : (
                    <p>{service.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
