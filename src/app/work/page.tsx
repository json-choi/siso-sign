import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProjectCard from "@/components/work/ProjectCard";
import ProjectRow from "@/components/work/ProjectRow";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { SITE_URL } from "@/lib/site";
import { contentDb } from "@/lib/database";
import { PROJECT_TYPES, PROJECT_TYPE_LABELS, toProjectType } from "@/lib/project-types";
import type { ProjectType } from "@/lib/project-types";

export const metadata: Metadata = {
  title: "포트폴리오",
  description:
    "시소사인의 간판 제작, 사이니지 디자인, 브랜딩 포트폴리오입니다. 다양한 공간과 브랜드를 위한 사인 디자인 작업을 확인하세요.",
  openGraph: {
    title: "포트폴리오 | 시소사인",
    description:
      "시소사인의 간판 제작, 사이니지 디자인, 브랜딩 포트폴리오입니다.",
    url: `${SITE_URL}/work`,
  },
  alternates: {
    canonical: `${SITE_URL}/work`,
  },
};

export const revalidate = 0;

async function getPortfolios() {
  const { data } = await contentDb
    .from('portfolios')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });
  
  return data || [];
}

type PageProps = { searchParams: Promise<{ type?: string }> };

export default async function WorkPage({ searchParams }: PageProps) {
  const [portfolios, { type }] = await Promise.all([getPortfolios(), searchParams]);
  const selectedType = toProjectType(type);
  // Rows appear once projects are classified; until then the page stays a single grid.
  const classified = portfolios.some((item) => toProjectType(item.project_type) !== null);
  const byType = (value: ProjectType | null) =>
    portfolios.filter((item) => toProjectType(item.project_type) === value);
  const rows = [
    ...PROJECT_TYPES.map((value) => ({ title: PROJECT_TYPE_LABELS[value], href: `/work?type=${value}`, projects: byType(value) })),
    { title: "Other Projects", href: undefined, projects: byType(null) },
  ].filter((row) => row.projects.length > 0);

  const fallbackProjects = [
    { id: '1', title: 'Project 1', category: 'Branding', description: '브랜드 아이덴티티 디자인', image_url: null },
    { id: '2', title: 'Project 2', category: 'Exhibition', description: '전시 공간 사이니지', image_url: null },
    { id: '3', title: 'Project 3', category: 'Signage', description: '통합 사인 시스템', image_url: null },
    { id: '4', title: 'Project 4', category: 'Branding', description: '모션 브랜딩', image_url: null },
  ];

  const showCategory = classified && selectedType !== null;
  const gridProjects = showCategory ? byType(selectedType) : portfolios.length > 0 ? portfolios : fallbackProjects;

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      <Header />

      <section className="pt-32 pb-20 px-6 overflow-x-hidden">
        <div className="container mx-auto">
          {showCategory ? (
            <div className="mb-12">
              <Link href="/work" className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Our Work
              </Link>
              <h1 className="mt-4 text-4xl md:text-6xl font-bold">{PROJECT_TYPE_LABELS[selectedType]}</h1>
              <p className="mt-3 text-gray-500">{gridProjects.length} projects</p>
            </div>
          ) : (
            <div className="mb-16">
              <h1 className="text-5xl md:text-7xl font-bold mb-4">Our Work</h1>
              <p className="text-xl text-gray-400 max-w-2xl">
                공간에 생명을 불어넣는 사인 디자인. 브랜드의 첫인상을 만듭니다.
              </p>
            </div>
          )}

          {classified && !showCategory ? (
            rows.map((row) => <ProjectRow key={row.title} title={row.title} href={row.href} projects={row.projects} />)
          ) : gridProjects.length === 0 ? (
            <p className="py-20 text-center text-gray-500">이 분류에 등록된 프로젝트가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
