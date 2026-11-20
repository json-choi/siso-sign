'use client';

import { useRef, useState } from 'react';
import { Move, RotateCcw, ZoomIn } from 'lucide-react';
import Modal from '@/components/admin/Modal';
import { Button } from '@/components/admin/ui';
import Image from '@/components/MediaImage';
import { cn } from '@/lib/cn';
import { DEFAULT_CROP, DISPLAY_RATIOS, DISPLAY_RATIO_LABELS, MAX_ZOOM, aspectRatioOf, cropStyle, isDefaultCrop } from '@/lib/image-display';
import type { DisplayRatio, ImageCrop } from '@/lib/image-display';

interface ImageCropEditorProps {
  url: string | null;
  crop: ImageCrop;
  ratio: DisplayRatio;
  onClose: () => void;
  onSave: (crop: ImageCrop, ratio: DisplayRatio) => void;
}

/**
 * Sets the point of a photo that stays in view and how far it is zoomed, with
 * live previews of the list card (4:3) and the project page frame.
 */
export default function ImageCropEditor({ url, crop: initialCrop, ratio: initialRatio, onClose, onSave }: ImageCropEditorProps) {
  return (
    <Modal open={url !== null} onClose={onClose} title="사진 보이는 영역 조정">
      {url && <Editor key={url} url={url} initialCrop={initialCrop} initialRatio={initialRatio} onClose={onClose} onSave={onSave} />}
    </Modal>
  );
}

interface EditorProps {
  url: string;
  initialCrop: ImageCrop;
  initialRatio: DisplayRatio;
  onClose: () => void;
  onSave: (crop: ImageCrop, ratio: DisplayRatio) => void;
}

function Editor({ url, initialCrop, initialRatio, onClose, onSave }: EditorProps) {
  const [crop, setCrop] = useState(initialCrop);
  const [ratio, setRatio] = useState(initialRatio);
  const frame = useRef<HTMLDivElement>(null);
  const natural = useRef<{ w: number; h: number } | null>(null);
  const drag = useRef<{ x: number; y: number; crop: ImageCrop } | null>(null);
  const editRatio = ratio === 'original' ? '4:3' : ratio;

  // Pixels the photo extends past the frame on each axis; dragging that far moves the view edge to edge.
  const overflow = () => {
    const box = frame.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };
    const image = natural.current ?? { w: box.width, h: box.height };
    const scale = Math.max(box.width / image.w, box.height / image.h);
    return {
      x: Math.max(image.w * scale - box.width, 0) + box.width * (crop.zoom - 1),
      y: Math.max(image.h * scale - box.height, 0) + box.height * (crop.zoom - 1),
    };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, crop };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    const room = overflow();
    // Dragging the photo right reveals more of its left side, so the kept point moves left.
    // An axis with nothing hidden (photo fits that way and no zoom) cannot move.
    const x = room.x < 1 ? start.crop.x : start.crop.x - ((event.clientX - start.x) / room.x) * 100;
    const y = room.y < 1 ? start.crop.y : start.crop.y - ((event.clientY - start.y) / room.y) * 100;
    setCrop({ ...start.crop, x: Math.round(Math.min(100, Math.max(0, x)) * 10) / 10, y: Math.round(Math.min(100, Math.max(0, y)) * 10) / 10 });
  };

  const stopDrag = () => {
    drag.current = null;
  };

  return (
    <div className="space-y-5">
      <div>
        <div
          ref={frame}
          className="relative w-full cursor-grab touch-none select-none overflow-hidden rounded-xl bg-black active:cursor-grabbing"
          style={{ aspectRatio: aspectRatioOf(editRatio) }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
        >
          <Image
            src={url}
            alt=""
            fill
            sizes="512px"
            className="pointer-events-none object-cover"
            style={cropStyle(crop)}
            draggable={false}
            onLoad={(event) => {
              const img = event.currentTarget;
              natural.current = { w: img.naturalWidth, h: img.naturalHeight };
            }}
          />
          <span
            className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.4)]"
            style={{ left: `${crop.x}%`, top: `${crop.y}%` }}
            aria-hidden
          />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
          <Move className="h-3.5 w-3.5" aria-hidden />
          사진을 끌어서 보여줄 부분을 맞추세요. 흰 점이 항상 화면 안에 남습니다. 확대하면 더 넓게 움직일 수 있습니다.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 flex items-center justify-between text-sm font-medium text-gray-300">
          <span className="flex items-center gap-1.5"><ZoomIn className="h-4 w-4" aria-hidden />확대</span>
          <span className="tabular-nums text-gray-500">{Math.round(crop.zoom * 100)}%</span>
        </span>
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={crop.zoom}
          onChange={(event) => setCrop({ ...crop, zoom: Number(event.target.value) })}
          className="w-full accent-primary"
        />
      </label>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-300">상세 페이지 사진 비율 <span className="font-normal text-gray-500">(이 프로젝트의 모든 사진)</span></p>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="상세 페이지 사진 비율">
          {DISPLAY_RATIOS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={ratio === option}
              onClick={() => setRatio(option)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                ratio === option ? 'border-primary bg-primary/15 text-white' : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white',
              )}
            >
              {DISPLAY_RATIO_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-300">미리보기</p>
        <div className="grid grid-cols-2 items-start gap-3">
          <Preview label="목록·홈 카드" url={url} crop={crop} ratio="4:3" />
          <Preview label={`상세 페이지 · ${DISPLAY_RATIO_LABELS[ratio]}`} url={url} crop={crop} ratio={ratio} />
        </div>
      </div>

      <div className="flex gap-2 border-t border-white/[0.06] pt-4">
        <Button variant="ghost" onClick={() => setCrop(DEFAULT_CROP)} disabled={isDefaultCrop(crop)}>
          <RotateCcw className="h-4 w-4" />
          초기화
        </Button>
        <div className="flex-1" />
        <Button onClick={onClose}>취소</Button>
        <Button variant="primary" onClick={() => onSave(crop, ratio)}>적용</Button>
      </div>
    </div>
  );
}

function Preview({ label, url, crop, ratio }: { label: string; url: string; crop: ImageCrop; ratio: DisplayRatio }) {
  const original = ratio === 'original';
  return (
    <figure className="min-w-0">
      <div className="relative w-full overflow-hidden rounded-lg bg-black" style={{ aspectRatio: aspectRatioOf(ratio) ?? '4 / 3' }}>
        <Image
          src={url}
          alt=""
          fill
          sizes="256px"
          className={original ? 'object-contain' : 'object-cover'}
          style={original ? undefined : cropStyle(crop)}
          draggable={false}
        />
      </div>
      <figcaption className="mt-1.5 truncate text-xs text-gray-500">{label}</figcaption>
    </figure>
  );
}
