import Image from '@/components/MediaImage';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';

function isDisplayable(src: string | null | undefined): src is string {
  return Boolean(src && (src.startsWith('/') || src.startsWith('http')));
}

/** Small admin preview, loaded at thumbnail size. */
export default function AdminThumb({ src, alt, className }: { src: string | null | undefined; alt: string; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-white/[0.06]', className)}>
      {isDisplayable(src) ? (
        <Image src={src} alt={alt} fill sizes="96px" className="object-cover" draggable={false} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-600">
          <ImageOff className="h-4 w-4" aria-hidden />
        </div>
      )}
    </div>
  );
}
