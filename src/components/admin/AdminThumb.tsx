import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';

function isDisplayable(src: string | null | undefined): src is string {
  return Boolean(src && (src.startsWith('/') || src.startsWith('http')));
}

/** Small admin preview. Admin images skip the optimizer so previews match what was uploaded. */
export default function AdminThumb({ src, alt, className }: { src: string | null | undefined; alt: string; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-white/[0.06]', className)}>
      {isDisplayable(src) ? (
        <Image src={src} alt={alt} fill unoptimized sizes="96px" className="object-cover" draggable={false} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-600">
          <ImageOff className="h-4 w-4" aria-hidden />
        </div>
      )}
    </div>
  );
}
