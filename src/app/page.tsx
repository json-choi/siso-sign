import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import { contentDb } from "@/lib/database";
import { toPlainText } from "@/lib/text";

export const revalidate = 0;

async function getBusinessSettings() {
  const { data } = await contentDb
    .from("site_settings")
    .select("key, value")
    .in("key", [
      "business_name",
      "business_address",
      "business_phone",
      "business_email",
    ]);

  const settings: Record<string, string> = {};
  data?.forEach((item) => {
    if (item.value) settings[item.key] = item.value;
  });
  return settings;
}

async function getSocialLinks() {
  const { data } = await contentDb
    .from("social_links")
    .select("url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (data || [])
    .map((item) => item.url)
    .filter((url): url is string => /^https?:\/\//.test(url));
}

function buildJsonLd(settings: Record<string, string>, socialLinks: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#business`,
    name: settings.business_name || "시소사인",
    alternateName: "siso-sign",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.jpg`,
    image: `${SITE_URL}/opengraph-image`,
    email: settings.business_email || "siso-sign@naver.com",
    telephone: settings.business_phone || undefined,
    address: settings.business_address
      ? {
          "@type": "PostalAddress",
          streetAddress: settings.business_address,
          addressCountry: "KR",
        }
      : undefined,
    priceRange: "$$",
    areaServed: {
      "@type": "Country",
      name: "대한민국",
    },
    serviceType: ["간판 제작", "사이니지 디자인", "브랜딩", "공간 디자인"],
    sameAs: socialLinks,
  };
}

async function getPortfolios() {
  const { data } = await contentDb
    .from("portfolios")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .limit(4);

  return data || [];
}

export default async function Home() {
  const [portfolios, businessSettings, socialLinks] = await Promise.all([
    getPortfolios(),
    getBusinessSettings(),
    getSocialLinks(),
  ]);

  const jsonLd = buildJsonLd(businessSettings, socialLinks);

  const fallbackProjects = [
    {
      id: "1",
      title: "Project 1",
      category: "Branding",
      description: "브랜드 아이덴티티 디자인 프로젝트",
      image_url: null,
    },
    {
      id: "2",
      title: "Project 2",
      category: "Exhibition",
      description: "전시 공간 사이니지 시스템",
      image_url: null,
    },
    {
      id: "3",
      title: "Project 3",
      category: "Signage",
      description: "상업 공간 통합 사인 시스템",
      image_url: null,
    },
    {
      id: "4",
      title: "Project 4",
      category: "Branding",
      description: "모션 그래픽 브랜딩",
      image_url: null,
    },
  ];

  const projects = portfolios.length > 0 ? portfolios : fallbackProjects;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
        <Header />

        <section className="h-screen flex items-center justify-center border-b border-white/10">
          <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-center">
            WE DESIGN!
            <br />
            <span className="text-primary">SIGNS</span> THAT
            <br />
            MATTER.
          </h1>
        </section>

        <section className="min-h-screen py-20 px-6 flex items-center border-b border-white/10">
          <div className="container mx-auto">
            <h2 className="text-4xl font-bold mb-8">About Us</h2>
            <p
              className="text-xl md:text-3xl leading-relaxed max-w-4xl mb-8"
              style={{ fontFamily: "var(--font-cal-sans)" }}
            >
              <span>
                <span className="text-primary">siso-sign&nbsp;</span>
                <span className="text-white">
                  은 공간의 가치를 높이는 시각적 정체성을 만드는 비주얼 솔루션
                  파트너입니다.
                </span>
              </span>
              <br />
              <span className="text-white">
                전략, 디자인, 그리고 기술의 조화를 통해 상상하던 브랜드의 모습을
                현실로 구현합니다.
              </span>
            </p>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 text-primary hover:text-white transition-colors"
            >
              <span>자세히 보기</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        <section className="min-h-screen py-20 px-6 border-b border-white/10">
          <div className="container mx-auto">
            <div className="flex items-end justify-between mb-12">
              <h2 className="text-4xl font-bold">Selected Work</h2>
              <Link
                href="/work"
                className="group flex items-center gap-2 text-gray-400 hover:text-primary transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.slice(0, 4).map((project) => (
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
                    <h3 className="text-xl font-bold text-white mt-1">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-300 mt-2">
                      {toPlainText(project.description)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="min-h-screen py-20 px-6 flex items-center border-b border-white/10">
          <div className="container mx-auto">
            <div className="flex items-end justify-between mb-12">
              <h2 className="text-4xl font-bold">Services</h2>
              <Link
                href="/service"
                className="group flex items-center gap-2 text-gray-400 hover:text-primary transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {["Branding", "Exhibition", "Signage"].map((service) => (
                <Link
                  key={service}
                  href="/service"
                  className="p-8 border border-white/10 rounded-lg hover:border-primary transition-colors group"
                >
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{service}</h3>
                  <p className="text-gray-400">
                    Comprehensive solutions for your business needs. We deliver
                    high-quality results tailored to your brand.
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="min-h-[50vh] py-20 px-6 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Let&apos;s work together
            </h2>
            <Link
              href="/contact"
              className="inline-block bg-primary text-black px-8 py-4 rounded-lg font-semibold hover:bg-white transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
