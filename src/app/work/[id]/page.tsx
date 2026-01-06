"use client";

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useRouter } from 'next/navigation';

export default function ProjectPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();
  // Assume images are placed under public/projects/{id}/1.jpg ... 6.jpg
  const images = Array.from({ length: 6 }).map((_, i) => `/projects/${id}/${i + 1}.jpg`);
  const [selected, setSelected] = useState<string>(images[0]);

  const currentIndex = images.indexOf(selected);
  const prev = () => setSelected(images[(currentIndex - 1 + images.length) % images.length]);
  const next = () => setSelected(images[(currentIndex + 1) % images.length]);

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      <Header />

      <section className="py-12 px-6">
        <div className="container mx-auto">
          <button onClick={() => router.back()} className="mb-6 text-sm text-gray-400 hover:text-primary">← Back</button>
          <h2 className="text-3xl font-bold mb-6">Project {id}</h2>

          <div className="flex flex-col gap-6">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 text-white p-2 rounded hover:bg-black/60">◀</button>
              <img src={selected} alt={selected} className="w-full h-[60vh] object-contain bg-black" />
              <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 text-white p-2 rounded hover:bg-black/60">▶</button>
            </div>

            <div className="overflow-x-auto py-2">
              <div className="flex gap-4">
                {images.map((src) => (
                  <div key={src} className={`flex-shrink-0 w-40 h-28 rounded-lg overflow-hidden cursor-pointer border ${selected===src? 'border-primary': 'border-transparent'}`} onClick={() => setSelected(src)}>
                    <img src={src} alt={src} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
