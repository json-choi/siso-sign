'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from '@/components/MediaImage';
import { aspectRatioOf, cropFor, cropStyle, toDisplayRatio } from '@/lib/image-display';
import { cn } from '@/lib/cn';
import type { PanInfo } from 'framer-motion';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  /** Crop per image URL, from the admin. */
  settings?: unknown;
  /** Frame shape for every photo; 'original' shows photos uncropped. */
  ratio?: unknown;
}

/** A swipe counts when it travels this far or flicks this fast. */
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 400;

export default function ImageCarousel({ images, alt, settings, ratio }: ImageCarouselProps) {
  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);
  const displayRatio = toDisplayRatio(ratio);
  const original = displayRatio === 'original';
  const frameStyle = { aspectRatio: aspectRatioOf(displayRatio) ?? '4 / 3' };

  const validImages = images?.filter((img) => img && (img.startsWith('/media/') || img.startsWith('http'))) || [];

  if (validImages.length === 0) {
    return (
      <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-white/5" style={frameStyle}>
        <p className="text-gray-500">이미지가 없습니다</p>
      </div>
    );
  }

  const count = validImages.length;
  const paginate = (step: number) => setPage(([current]) => [(current + step + count) % count, step]);
  const goTo = (target: number) => setPage(([current]) => [target, target > current ? 1 : -1]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) paginate(1);
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) paginate(-1);
  };

  const renderImage = (src: string, label: string) => (
    <Image
      src={src}
      alt={label}
      fill
      sizes="(min-width: 1024px) 66vw, 100vw"
      className={cn('pointer-events-none select-none', original ? 'object-contain' : 'object-cover')}
      style={original ? undefined : cropStyle(cropFor(settings, src))}
      draggable={false}
      priority
    />
  );

  if (count === 1) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-white/5" style={frameStyle}>
        {renderImage(validImages[0], alt)}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="relative overflow-hidden rounded-xl bg-white/5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={frameStyle}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${alt} 사진 ${count}장. 좌우로 밀거나 방향키로 넘기세요.`}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') paginate(-1);
          if (event.key === 'ArrowRight') paginate(1);
        }}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0, opacity: 1 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 1 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: 'spring', stiffness: 320, damping: 34 } }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={onDragEnd}
            className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
          >
            {renderImage(validImages[index], `${alt} - ${index + 1}`)}
          </motion.div>
        </AnimatePresence>

        <button
          onClick={() => paginate(-1)}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          aria-label="이전 이미지"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => paginate(1)}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          aria-label="다음 이미지"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-2 py-1 text-sm text-white tabular-nums">
          {index + 1} / {count}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {validImages.map((_, dot) => (
          <button
            key={dot}
            onClick={() => goTo(dot)}
            className={`h-2 w-2 rounded-full transition-colors ${dot === index ? 'bg-primary' : 'bg-white/30 hover:bg-white/50'}`}
            aria-label={`${dot + 1}번 이미지로 이동`}
            aria-current={dot === index}
          />
        ))}
      </div>
    </div>
  );
}
