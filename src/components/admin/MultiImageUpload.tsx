'use client';

import { useRef, useState } from 'react';
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ImagePlus, Loader2, Star, X } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/cn';
import { uploadImage } from '@/lib/upload';
import type { DragEndEvent } from '@dnd-kit/core';

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

export default function MultiImageUpload({ value, onChange, maxImages = 10 }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleUpload = async (files: File[]) => {
    setError('');
    const images = files.filter((file) => file.type.startsWith('image/'));
    const remaining = maxImages - value.length;
    if (remaining <= 0) {
      setError(`최대 ${maxImages}장까지만 업로드할 수 있습니다.`);
      return;
    }
    const batch = images.slice(0, remaining);
    if (images.length > remaining) setError(`최대 ${maxImages}장까지라 ${images.length - remaining}장은 제외했습니다.`);
    if (!batch.length) return;

    setUploading({ done: 0, total: batch.length });
    const uploaded: string[] = [];
    const failed: string[] = [];
    for (const file of batch) {
      try {
        uploaded.push(await uploadImage(file));
      } catch (err) {
        failed.push(err instanceof Error ? err.message : file.name);
      }
      setUploading({ done: uploaded.length + failed.length, total: batch.length });
    }
    if (uploaded.length) onChange([...value, ...uploaded]);
    if (failed.length) setError(`${failed.length}장 업로드 실패: ${failed[0]}`);
    setUploading(null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onChange(arrayMove(value, value.indexOf(String(active.id)), value.indexOf(String(over.id))));
  };

  const makeCover = (url: string) => onChange([url, ...value.filter((item) => item !== url)]);
  const remove = (url: string) => onChange(value.filter((item) => item !== url));

  // URLs double as sortable ids, so duplicates are dropped.
  const items = [...new Set(value)];

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          if (files.length) void handleUpload(files);
        }}
      />

      {items.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {items.map((url, index) => (
                <SortableImage key={url} url={url} index={index} onRemove={remove} onCover={makeCover} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {items.length < maxImages && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            void handleUpload(Array.from(event.dataTransfer.files));
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          disabled={uploading !== null}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 transition-colors',
            items.length ? 'py-6' : 'py-12',
            dragOver ? 'border-primary bg-primary/10' : 'border-white/15 bg-white/[0.02] hover:border-white/30',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="text-sm text-gray-300">업로드 중… {uploading.done}/{uploading.total}</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-7 w-7 text-gray-500" />
              <span className="text-sm font-medium text-white">사진 추가</span>
              <span className="text-xs text-gray-500">
                탭하거나 끌어다 놓기 · {items.length}/{maxImages}장
              </span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}

      {items.length > 1 && (
        <p className="text-xs text-gray-500">첫 번째 사진이 대표 이미지입니다. 사진을 길게 눌러(또는 끌어서) 순서를 바꾸세요.</p>
      )}
    </div>
  );
}

interface SortableImageProps {
  url: string;
  index: number;
  onRemove: (url: string) => void;
  onCover: (url: string) => void;
}

function SortableImage({ url, index, onRemove, onCover }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('relative aspect-square overflow-hidden rounded-lg bg-white/[0.06]', isDragging && 'z-10 opacity-70 ring-2 ring-primary')}
    >
      <div {...attributes} {...listeners} className="absolute inset-0 cursor-grab touch-manipulation active:cursor-grabbing" aria-label={`이미지 ${index + 1} 순서 변경`}>
        <Image src={url} alt="" fill unoptimized sizes="160px" className="object-cover" draggable={false} />
      </div>
      {index === 0 ? (
        <span className="pointer-events-none absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-white">대표</span>
      ) : (
        <button
          type="button"
          onClick={() => onCover(url)}
          className="absolute left-1.5 top-1.5 rounded bg-black/60 p-1 text-white/80 backdrop-blur hover:text-white"
          aria-label="대표 이미지로 설정"
          title="대표 이미지로 설정"
        >
          <Star className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={() => onRemove(url)}
        className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white backdrop-blur hover:bg-red-600"
        aria-label={`이미지 ${index + 1} 삭제`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
