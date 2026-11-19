'use client';

import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { DragEndEvent } from '@dnd-kit/core';
import type { ReactNode } from 'react';

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  label: (item: T) => string;
  children: (item: T) => ReactNode;
}

/** Vertical list reordered by a drag handle; works with mouse, touch (long press) and keyboard. */
export default function SortableList<T extends { id: string }>({ items, onReorder, label, children }: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from !== -1 && to !== -1) onReorder(arrayMove(items, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id} label={label(item)}>
              {children(item)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  // Pointer drags start anywhere on the row; keyboard drags only from the handle.
  const { onKeyDown, ...pointerListeners } = listeners ?? {};

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...pointerListeners}
      onDragStart={(event) => event.preventDefault()}
      className={cn(
        'flex cursor-grab items-stretch gap-1 rounded-xl border border-white/[0.07] bg-[#141414] p-2 select-none [-webkit-touch-callout:none] active:cursor-grabbing',
        isDragging && 'relative z-10 border-primary/40 shadow-2xl shadow-black/60',
      )}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        onKeyDown={(event) => onKeyDown?.(event)}
        className="flex w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-gray-600 hover:bg-white/5 hover:text-gray-300 active:cursor-grabbing"
        aria-label={`${label} 순서 이동`}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}
