'use client';

import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Loader2, GripVertical } from 'lucide-react';
import Image from 'next/image';

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

export default function MultiImageUpload({ value, onChange, maxImages = 10 }: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    setError('');
    
    const remainingSlots = maxImages - value.length;
    if (remainingSlots <= 0) {
      setError(`최대 ${maxImages}장까지만 업로드할 수 있습니다.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || '업로드에 실패했습니다.');
          continue;
        }

        uploadedUrls.push(data.url);
      }

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);
      }
    } catch {
      setError('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        const dt = new DataTransfer();
        imageFiles.forEach(f => dt.items.add(f));
        handleUpload(dt.files);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemove = (index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const newImages = [...value];
    const draggedImage = newImages[dragIndex];
    newImages.splice(dragIndex, 1);
    newImages.splice(index, 0, draggedImage);
    
    setDragIndex(index);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        multiple
        className="hidden"
      />

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOverItem(e, index)}
              className={`relative aspect-square rounded-lg overflow-hidden bg-white/10 group cursor-move ${
                dragIndex === index ? 'opacity-50 ring-2 ring-primary' : ''
              }`}
            >
              <Image
                src={url}
                alt={`이미지 ${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-2 bg-red-500/70 rounded-full hover:bg-red-500 transition-colors"
                  title="삭제"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="absolute top-2 left-2 bg-black/60 rounded px-2 py-1 text-xs text-white">
                {index + 1}
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-5 h-5 text-white drop-shadow" />
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length < maxImages && (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`aspect-video rounded-lg border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 ${
            dragOver
              ? 'border-primary bg-primary/10'
              : 'border-white/20 hover:border-white/40 bg-white/5'
          } ${isUploading ? 'pointer-events-none' : ''}`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-gray-400">업로드 중...</p>
            </>
          ) : (
            <>
              <div className="p-4 rounded-full bg-white/10">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">이미지를 드래그하거나 클릭하여 업로드</p>
                <p className="text-sm text-gray-500 mt-1">
                  JPG, PNG, GIF, WEBP (최대 10MB, {maxImages}장까지)
                </p>
                {value.length > 0 && (
                  <p className="text-sm text-primary mt-1">
                    {value.length}/{maxImages}장 업로드됨
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {value.length > 0 && (
        <p className="text-xs text-gray-500">
          드래그하여 순서를 변경할 수 있습니다. 첫 번째 이미지가 대표 이미지로 사용됩니다.
        </p>
      )}
    </div>
  );
}
