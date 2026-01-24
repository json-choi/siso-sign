import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ImageCarousel from "@/components/ImageCarousel";
import type { Metadata } from "next";

export const revalidate = 0;

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("title, description, category, image_url")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!portfolio) {
    return {
      title: "프로젝트",
    };
  }

  return {
    title: portfolio.title,
    description: portfolio.description || `${portfolio.title} - 시소사인 포트폴리오`,
    openGraph: {
      title: `${portfolio.title} | 시소사인`,
      description: portfolio.description || `${portfolio.title} - 시소사인 포트폴리오`,
      url: `https://siso-sign.com/work/${id}`,
      images: portfolio.image_url
        ? [{ url: portfolio.image_url, alt: portfolio.title }]
        : undefined,
    },
    alternates: {
      canonical: `https://siso-sign.com/work/${id}`,
    },
  };
}

async function getPortfolio(id: string) {
  const { data } = await supabase
    .from('portfolios')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single();
  
  return data;
}

async function getRelatedPortfolios(currentId: string, category: string | null) {
  const { data } = await supabase
    .from('portfolios')
    .select('*')
    .eq('is_published', true)
    .neq('id', currentId)
    .limit(3);
  
  return data || [];
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;
  
  const portfolio = await getPortfolio(id);
  
  const fallbackProjects: Record<string, { title: string; category: string; description: string; image_url: string | null; images: string[] }> = {
    '1': { title: 'Project 1', category: 'Branding', description: '브랜드 아이덴티티 디자인 프로젝트입니다. 로고, 컬러 시스템, 타이포그래피 등 브랜드의 시각적 정체성을 확립했습니다.', image_url: null, images: [] },
    '2': { title: 'Project 2', category: 'Exhibition', description: '전시 공간을 위한 사이니지 시스템입니다. 방문객의 동선을 고려한 직관적인 안내 시스템을 디자인했습니다.', image_url: null, images: [] },
    '3': { title: 'Project 3', category: 'Signage', description: '상업 공간의 통합 사인 시스템입니다. 외부 간판부터 내부 안내까지 일관된 브랜드 경험을 제공합니다.', image_url: null, images: [] },
    '4': { title: 'Project 4', category: 'Branding', description: '모션 그래픽을 활용한 브랜딩 프로젝트입니다. 디지털 환경에서 브랜드의 역동성을 표현했습니다.', image_url: null, images: [] },
  };

  const project = portfolio || fallbackProjects[id];
  
  if (!project) {
    notFound();
  }

  const relatedPortfolios = portfolio 
    ? await getRelatedPortfolios(id, portfolio.category)
    : Object.entries(fallbackProjects)
        .filter(([key]) => key !== id)
        .slice(0, 3)
        .map(([key, val]) => ({ id: key, ...val }));

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      <Header />

      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <Link 
            href="/work" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Work</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <ImageCarousel 
                images={project.images || (project.image_url ? [project.image_url] : [])} 
                alt={project.title} 
              />
            </div>

            <div className="lg:col-span-1">
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                {project.category}
              </span>
              <h1 className="text-4xl font-bold text-white mt-2 mb-6">{project.title}</h1>
              <p className="text-gray-400 leading-relaxed">{project.description}</p>
            </div>
          </div>

          {relatedPortfolios.length > 0 && (
            <div className="mt-24">
              <h2 className="text-2xl font-bold mb-8">Related Work</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPortfolios.map((item) => (
                  <Link 
                    key={item.id} 
                    href={`/work/${item.id}`}
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-white/5"
                  >
                    {item.image_url && item.image_url.startsWith('http') ? (
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-gray-600 text-sm">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
