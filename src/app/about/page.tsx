import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { User, Target, Eye, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | siso-sign",
  description:
    "시소사인은 공간의 가치를 높이는 시각적 정체성을 만드는 크리에이티브 에이전시입니다.",
};

export const revalidate = 0;

const defaultValues: Record<string, string> = {
  about_title: 'About Us',
  about_description_1: '우리는 독창적인 디지털 경험을 창조하는 크리에이티브 스튜디오입니다. 예술과 기술을 결합하여 브랜드와 사람 사이의 의미 있는 연결을 만들어내는 것에 열정을 쏟고 있습니다.',
  about_description_2: '혁신과 탁월한 디자인을 바탕으로, 새로운 시각과 최고의 품질을 추구하며 모든 프로젝트에 임합니다. 브랜딩, 웹 디자인, 인터랙티브 설치물 등 다양한 분야에서 아이디어를 현실로 구현합니다.',
  about_image_url: '',
  about_value_1_title: '진심',
  about_value_1_subtitle: 'Sincerity',
  about_value_2_title: '정확',
  about_value_2_subtitle: 'Accuracy',
  about_value_3_title: '안목',
  about_value_3_subtitle: 'Insight',
  about_value_4_title: '완벽',
  about_value_4_subtitle: 'Perfection',
};

async function getAboutSettings() {
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .like('key', 'about_%');

  const settings: Record<string, string> = { ...defaultValues };
  data?.forEach((item) => {
    if (item.value) settings[item.key] = item.value;
  });
  return settings;
}

const iconMap = [User, Target, Eye, CheckCircle];

export default async function AboutPage() {
  const settings = await getAboutSettings();

  const coreValues = [
    { title: settings.about_value_1_title, subtitle: settings.about_value_1_subtitle, icon: iconMap[0] },
    { title: settings.about_value_2_title, subtitle: settings.about_value_2_subtitle, icon: iconMap[1] },
    { title: settings.about_value_3_title, subtitle: settings.about_value_3_subtitle, icon: iconMap[2] },
    { title: settings.about_value_4_title, subtitle: settings.about_value_4_subtitle, icon: iconMap[3] },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      <Header />

      <section className="container mx-auto px-6 py-20 pt-32 min-h-[60vh] flex flex-col justify-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-12">{settings.about_title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-lg md:text-xl leading-relaxed text-gray-300">
            <p>{settings.about_description_1}</p>
            <p>{settings.about_description_2}</p>
          </div>
          {settings.about_image_url && settings.about_image_url.startsWith('http') ? (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10">
              <Image
                src={settings.about_image_url}
                alt="About siso-sign"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <span className="text-gray-500">Image Placeholder</span>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white/5 py-20 border-y border-white/10">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreValues.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="group p-8 border border-white/10 rounded-xl hover:border-primary transition-colors bg-background/50 backdrop-blur-sm"
                >
                  <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mb-6 text-white group-hover:text-primary group-hover:border-primary transition-colors">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                    {value.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
