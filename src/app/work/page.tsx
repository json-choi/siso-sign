import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function WorkPage() {
  const projects = Array.from({ length: 30 }).map((_, i) => ({
    id: i + 1,
    title: `Project ${i + 1}`,
  }));

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      <Header />

      <section className="min-h-screen py-20 px-6 border-b border-white/10">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold mb-12">Selected Work</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {projects.map((p) => (
              <div key={p.id} className="bg-white/5 rounded-lg overflow-hidden p-6 flex flex-col justify-end h-56">
                <div className="text-lg font-semibold">{p.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
