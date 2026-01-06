import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Image from "next/image";

export default function Home() {
  const projects = [
    {
      title: "Project 1",
      image: "/project1.png", // Make sure project1.jpg is in the 'public' folder
    },
    {
      title: "Project 2",
      image: "/project2.jpg", // Make sure project2.jpg is in the 'public' folder
    },
    {
      title: "Project 3",
      image: "/project3.png", // Make sure project3.png is in the 'public' folder
    },
    {
      title: "Project 4",
      image: "/project4.gif", // Make sure project4.gif is in the 'public' folder
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      <Header />
      
      {/* Hero Section */}
      <section id="hero" className="h-screen flex items-center justify-center border-b border-white/10">
        <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-center">
          WE DESIGN!<br />
          <span className="text-primary">SIGNS</span> THAT<br />
          MATTER.
        </h1>
      </section>

      {/* About Section */}
      <section id="about" className="min-h-screen py-20 px-6 flex items-center border-b border-white/10">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold mb-8">About Us</h2>
          <p className="text-xl md:text-3xl leading-relaxed max-w-4xl" style={{ fontFamily: 'var(--font-cal-sans)' }}>
            <span className="whitespace-nowrap text-primary">siso-sign&nbsp;</span>
            <span className="whitespace-pre-wrap text-white">은 공간의 가치를 높이는 시각적 정체성을 만드는 비주얼 솔루션 파트너입니다.</span>
            <br />
            <span className="whitespace-nowrap text-white">전략, 디자인, 그리고 기술의 조화를 통해 상상하던 브랜드의 모습을 현실로 구현합니다.</span>
          </p>
        </div>
      </section>

      {/* Work Section */}
      <section id="work" className="min-h-screen py-20 px-6 border-b border-white/10">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold mb-12">Selected Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project) => (
              <div key={project.title} className="bg-white/5 rounded-lg group relative overflow-hidden cursor-pointer">
                <Image
                  src={project.image}
                  alt={project.title}
                  width={800}
                  height={450}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-2xl font-bold text-white">{project.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="min-h-screen py-20 px-6 flex items-center border-b border-white/10">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold mb-12">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['Branding', 'Web Design', 'Signage'].map((service) => (
              <div key={service} className="p-8 border border-white/10 rounded-lg hover:border-primary transition-colors">
                <h3 className="text-2xl font-bold mb-4">{service}</h3>
                <p className="text-gray-400">
                  Comprehensive solutions for your business needs. We deliver high-quality results tailored to your brand.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="min-h-[50vh] py-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">Let's work together</h2>
          <a href="mailto:siso-sign@naver.com" className="text-xl md:text-2xl text-primary hover:underline font-semibold">
            siso-sign@naver.com
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
