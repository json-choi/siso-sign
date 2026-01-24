'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCarouselProps {
  images: string[];
  alt: string;
}

export default function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const validImages = images?.filter(img => img && img.startsWith('http')) || [];

  if (validImages.length === 0) {
    return (
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
        <p className="text-gray-500">이미지가 없습니다</p>
      </div>
    );
  }

  if (validImages.length === 1) {
    return (
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white/5">
        <Image
          src={validImages[0]}
          alt={alt}
          fill
          className="object-cover"
          priority
        />
      </div>
    );
  }

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="relative">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white/5">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <Image
              src={validImages[currentIndex]}
              alt={`${alt} - ${currentIndex + 1}`}
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>

        <button
          onClick={goToPrevious}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="이전 이미지"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="다음 이미지"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/50 text-white text-sm">
          {currentIndex + 1} / {validImages.length}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {validImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-primary' : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`${index + 1}번 이미지로 이동`}
          />
        ))}
      </div>
    </div>
  );
}
