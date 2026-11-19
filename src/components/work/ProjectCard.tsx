import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { toPlainText } from "@/lib/text";

export interface WorkProject {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  image_url: string | null;
}

function hasImage(src: string | null): src is string {
  return Boolean(src && (src.startsWith("/media/") || src.startsWith("http")));
}

export default function ProjectCard({ project, className }: { project: WorkProject; className?: string }) {
  return (
    <Link
      href={`/work/${project.id}`}
      className={cn("group relative block aspect-[4/3] rounded-xl overflow-hidden bg-white/5", className)}
    >
      {hasImage(project.image_url) ? (
        <Image
          src={project.image_url}
          alt={project.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 45vw, 80vw"
          unoptimized={project.image_url.startsWith("/media/")}
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-600 text-sm">No Image</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        {project.category && (
          <span className="text-xs font-medium text-primary uppercase tracking-wider">{project.category}</span>
        )}
        <h3 className="text-xl font-bold text-white mt-1">{project.title}</h3>
        <p className="text-sm text-gray-300 mt-2 line-clamp-2">{toPlainText(project.description)}</p>
      </div>
      <div className="absolute inset-0 flex items-center justify-center px-4 text-center opacity-100 group-hover:opacity-0 transition-opacity duration-300">
        <h3 className="text-lg font-semibold text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{project.title}</h3>
      </div>
    </Link>
  );
}
