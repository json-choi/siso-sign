'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import ProjectCard from "@/components/work/ProjectCard";
import type { WorkProject } from "@/components/work/ProjectCard";

interface ProjectRowProps {
  title: string;
  projects: WorkProject[];
  href?: string;
}

/** One category as a horizontally scrolling row with arrows on larger screens. */
export default function ProjectRow({ title, projects, href }: ProjectRowProps) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  const scroll = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section className="mt-16 first:mt-0" aria-label={title}>
      <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-4 mb-6">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
          {title}
          <span className="ml-3 align-middle text-sm md:text-base font-normal text-gray-500">{projects.length}</span>
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          {href && (
            <Link href={href} className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white">
              전체 보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <div className={edges.start && edges.end ? "hidden" : "hidden md:flex items-center gap-2 ml-2"}>
            <button
              type="button"
              onClick={() => scroll(-1)}
              disabled={edges.start}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-gray-300 transition-colors hover:border-white/60 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              aria-label={`${title} 이전`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              disabled={edges.end}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-gray-300 transition-colors hover:border-white/60 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              aria-label={`${title} 다음`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <ul
        ref={track}
        onScroll={update}
        className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-6 px-6 pb-2 md:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((project) => (
          <li key={project.id} className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-3rem)/3)]">
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
    </section>
  );
}
