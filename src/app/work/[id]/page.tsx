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
  const [active, setActive] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      <Header />

      <section className="py-12 px-6">
        <div className="container mx-auto">
          <button onClick={() => router.back()} className="mb-6 text-sm text-gray-400 hover:text-primary">← Back</button>
          <h2 className="text-3xl font-bold mb-6">Project {id}</h2>

          <div className="overflow-x-auto -mx-6 py-4">
            <div className="flex gap-4 px-6">
              {images.map((src) => (
                <div key={src} className="flex-shrink-0 w-80 h-56 bg-gray-900 rounded-lg overflow-hidden cursor-pointer" onClick={() => setActive(src)}>
                  {/* use img; Next Image could be used but keep simple */}
                  <img src={src} alt={src} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Lightbox */}
          {active && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setActive(null)}>
              <div className="max-w-[90%] max-h-[90%]">
                <img src={active} alt="active" className="w-full h-auto max-h-[90vh] object-contain" />
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
