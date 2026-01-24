import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "포트폴리오",
  description:
    "시소사인의 간판 제작, 사이니지 디자인, 브랜딩 포트폴리오입니다. 다양한 공간과 브랜드를 위한 사인 디자인 작업을 확인하세요.",
  openGraph: {
    title: "포트폴리오 | 시소사인",
    description:
      "시소사인의 간판 제작, 사이니지 디자인, 브랜딩 포트폴리오입니다.",
    url: "https://siso-sign.com/work",
  },
  alternates: {
    canonical: "https://siso-sign.com/work",
  },
};

export const revalidate = 0;

async function getPortfolios() {
  const { data } = await supabase
    .from('portfolios')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });
  
  return data || [];
}

export default async function WorkPage() {
  const portfolios = await getPortfolios();

  const fallbackProjects = [
    { id: '1', title: 'Project 1', category: 'Branding', description: '브랜드 아이덴티티 디자인', image_url: null },
    { id: '2', title: 'Project 2', category: 'Exhibition', description: '전시 공간 사이니지', image_url: null },
    { id: '3', title: 'Project 3', category: 'Signage', description: '통합 사인 시스템', image_url: null },
    { id: '4', title: 'Project 4', category: 'Branding', description: '모션 브랜딩', image_url: null },
  ];

  const projects = portfolios.length > 0 ? portfolios : fallbackProjects;

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      <Header />

      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-4">Our Work</h1>
            <p className="text-xl text-gray-400 max-w-2xl">
              공간에 생명을 불어넣는 사인 디자인. 브랜드의 첫인상을 만듭니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link 
                key={project.id} 
                href={`/work/${project.id}`}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-white/5"
              >
                {project.image_url && project.image_url.startsWith('http') ? (
                  <Image
                    src={project.image_url}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-gray-600 text-sm">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">
                    {project.category}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">{project.title}</h3>
                  <p className="text-sm text-gray-300 mt-2 line-clamp-2">{project.description}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                  <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
