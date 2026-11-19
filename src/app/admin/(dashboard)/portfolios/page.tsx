'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowRightLeft, Eye, EyeOff, GripVertical, MoreHorizontal, Pencil, Plus, Search, Star, Trash2, X } from 'lucide-react';
import { useFeedback } from '@/components/admin/AdminFeedback';
import AdminThumb from '@/components/admin/AdminThumb';
import Modal from '@/components/admin/Modal';
import { Badge, ButtonLink, EmptyState, ErrorState, LoadingState, PageHeader, inputClass } from '@/components/admin/ui';
import { adminRequest, errorMessage } from '@/lib/admin-api';
import { cn } from '@/lib/cn';
import { COLUMN_IDS, changedPlacements, columnType, findColumn, groupPortfolios, isColumnId, moveItem } from '@/lib/portfolio-board';
import { PROJECT_TYPE_LABELS } from '@/lib/project-types';
import type { CollisionDetection, DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import type { ColumnId, Columns } from '@/lib/portfolio-board';
import type { Portfolio } from '@/types/database';

const COLUMN_META: Record<ColumnId, { title: string; hint: string }> = {
  commercial: { title: PROJECT_TYPE_LABELS.commercial, hint: '' },
  retail: { title: PROJECT_TYPE_LABELS.retail, hint: '' },
  unclassified: { title: '미분류', hint: '아직 분류되지 않은 프로젝트입니다. 아래 분류로 끌어다 놓으세요.' },
};

const EMPTY_COLUMNS: Columns = { commercial: [], retail: [], unclassified: [] };

export default function PortfoliosPage() {
  const feedback = useFeedback();
  const [items, setItems] = useState<Map<string, Portfolio>>(new Map());
  const [columns, setColumns] = useState<Columns>(EMPTY_COLUMNS);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lockedHeights, setLockedHeights] = useState<Partial<Record<ColumnId, number>>>({});
  const columnEls = useRef<Partial<Record<ColumnId, HTMLElement | null>>>({});
  const dragStart = useRef<Columns | null>(null);
  const columnsRef = useRef(columns);
  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  // Cards are wide, so corner-based detection can pick the neighbouring column.
  // Use the column under the pointer, then the nearest card inside it.
  const collisionDetection = useCallback<CollisionDetection>((args) => {
    if (!args.pointerCoordinates) return closestCorners(args);
    const column = pointerWithin(args).find((hit) => isColumnId(hit.id));
    if (!column) return [];
    const ids = columnsRef.current[column.id as ColumnId];
    const cards = args.droppableContainers.filter((container) => ids.includes(String(container.id)));
    return cards.length ? closestCenter({ ...args, droppableContainers: cards }) : [column];
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await adminRequest<Portfolio[]>('/api/admin/portfolios');
      setItems(new Map(data.map((item) => [item.id, item])));
      setColumns(groupPortfolios(data));
      setStatus('ready');
    } catch (error) {
      setLoadError(errorMessage(error, '포트폴리오를 불러오지 못했습니다.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    // Fetching on mount is the intended side effect here; state is set after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // A short press before dragging keeps normal scrolling on phones.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /** Saves new positions; rolls back to `previous` if the server rejects them. */
  const persist = useCallback(async (next: Columns, previous: Columns, message?: string) => {
    const changes = changedPlacements(next, items);
    if (!changes.length) return;
    setSaving(true);
    try {
      await adminRequest('/api/admin/portfolios/order', { method: 'PUT', json: changes });
      setItems((current) => {
        const updated = new Map(current);
        for (const change of changes) {
          const item = updated.get(change.id);
          if (item) updated.set(change.id, { ...item, project_type: change.project_type, sort_order: change.sort_order });
        }
        return updated;
      });
      if (message) feedback.success(message);
    } catch (error) {
      setColumns(previous);
      feedback.error(errorMessage(error, '순서를 저장하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  }, [items, feedback]);

  const onDragStart = ({ active }: DragStartEvent) => {
    dragStart.current = columns;
    // Keep columns from shrinking mid-drag, which would move the drop targets under the pointer.
    const heights: Partial<Record<ColumnId, number>> = {};
    for (const column of COLUMN_IDS) {
      const element = columnEls.current[column];
      if (element) heights[column] = element.offsetHeight;
    }
    setLockedHeights(heights);
    setActiveId(String(active.id));
  };

  // Moving across columns happens while hovering so the target column opens a gap.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const id = String(active.id);
    setColumns((current) => {
      const from = findColumn(current, id);
      const to = findColumn(current, String(over.id));
      if (!from || !to || from === to) return current;
      const overIndex = current[to].indexOf(String(over.id));
      return moveItem(current, id, to, overIndex === -1 ? current[to].length : overIndex);
    });
  };

  // Dropping keeps the placeholder's position, even if the pointer ended between columns.
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const previous = dragStart.current ?? columns;
    dragStart.current = null;
    setActiveId(null);
    setLockedHeights({});
    const id = String(active.id);
    const column = findColumn(columns, id);
    let next = columns;
    if (column && over) {
      const from = columns[column].indexOf(id);
      const to = columns[column].indexOf(String(over.id));
      if (to !== -1 && from !== to) next = { ...columns, [column]: arrayMove(columns[column], from, to) };
    }
    setColumns(next);
    const before = findColumn(previous, id);
    const moved = column && before !== column ? `${COLUMN_META[column].title}(으)로 이동했습니다.` : undefined;
    void persist(next, previous, moved);
  };

  const onDragCancel = () => {
    if (dragStart.current) setColumns(dragStart.current);
    dragStart.current = null;
    setActiveId(null);
    setLockedHeights({});
  };

  const moveTo = (id: string, column: ColumnId) => {
    setMenuFor(null);
    const previous = columns;
    const next = moveItem(columns, id, column);
    setColumns(next);
    void persist(next, previous, `${COLUMN_META[column].title}(으)로 이동했습니다.`);
  };

  const updateItem = async (item: Portfolio, patch: Partial<Portfolio>, message: string) => {
    setMenuFor(null);
    setItems((current) => new Map(current).set(item.id, { ...item, ...patch }));
    try {
      await adminRequest(`/api/admin/portfolios/${item.id}`, { method: 'PUT', json: patch });
      feedback.success(message);
    } catch (error) {
      setItems((current) => new Map(current).set(item.id, item));
      feedback.error(errorMessage(error, '변경하지 못했습니다.'));
    }
  };

  const remove = async (item: Portfolio) => {
    setMenuFor(null);
    const ok = await feedback.confirm({
      title: '프로젝트를 삭제할까요?',
      description: `"${item.title}"을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.`,
      confirmLabel: '삭제',
      danger: true,
    });
    if (!ok) return;
    try {
      await adminRequest(`/api/admin/portfolios/${item.id}`, { method: 'DELETE' });
      setColumns((current) => {
        const column = findColumn(current, item.id);
        return column ? { ...current, [column]: current[column].filter((id) => id !== item.id) } : current;
      });
      setItems((current) => {
        const next = new Map(current);
        next.delete(item.id);
        return next;
      });
      feedback.success('삭제했습니다.');
    } catch (error) {
      feedback.error(errorMessage(error, '삭제하지 못했습니다.'));
    }
  };

  const search = query.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!search) return columns;
    const match = (id: string) => {
      const item = items.get(id);
      return Boolean(item && `${item.title} ${item.category ?? ''}`.toLowerCase().includes(search));
    };
    return { commercial: columns.commercial.filter(match), retail: columns.retail.filter(match), unclassified: columns.unclassified.filter(match) };
  }, [columns, items, search]);

  if (status === 'loading') return <LoadingState rows={4} />;
  if (status === 'error') return <ErrorState message={loadError} onRetry={() => { setStatus('loading'); void load(); }} />;

  const total = items.size;
  const active = activeId ? items.get(activeId) : undefined;
  const menuItem = menuFor ? items.get(menuFor) : undefined;
  const menuColumn = menuFor ? findColumn(columns, menuFor) : null;
  const showUnclassified = columns.unclassified.length > 0 || activeId !== null;
  const dragDisabled = Boolean(search);

  const renderColumn = (column: ColumnId) => (
    <BoardColumn
      key={column}
      column={column}
      ids={visible[column]}
      items={items}
      dragDisabled={dragDisabled}
      onMenu={setMenuFor}
      onToggle={updateItem}
      searching={Boolean(search)}
      minHeight={lockedHeights[column]}
      elementRef={(element) => { columnEls.current[column] = element; }}
    />
  );

  return (
    <div>
      <PageHeader
        title="포트폴리오"
        description={
          <>
            프로젝트 {total}개 · 카드를 끌어서 <span className="text-gray-300">분류와 순서</span>를 바꿀 수 있습니다.
            {saving && <span className="ml-2 text-gray-500">저장 중…</span>}
          </>
        }
        actions={
          <ButtonLink href="/admin/portfolios/new" variant="primary">
            <Plus className="h-4 w-4" />
            새 프로젝트
          </ButtonLink>
        }
      />

      {total === 0 ? (
        <EmptyState
          title="등록된 프로젝트가 없습니다"
          description="첫 프로젝트를 추가해 포트폴리오를 시작하세요."
          action={<ButtonLink href="/admin/portfolios/new" variant="primary"><Plus className="h-4 w-4" />새 프로젝트</ButtonLink>}
        />
      ) : (
        <>
          <div className="relative mb-5">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="제목 또는 카테고리로 검색"
              className={cn(inputClass, 'pl-10 pr-10')}
              aria-label="프로젝트 검색"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-500 hover:text-white" aria-label="검색어 지우기">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {dragDisabled && <p className="-mt-2 mb-4 text-xs text-gray-500">검색 중에는 드래그가 꺼집니다. ··· 메뉴로 분류를 바꿀 수 있습니다.</p>}

          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
            accessibility={{
              screenReaderInstructions: { draggable: '스페이스바로 들어 올리고 방향키로 옮긴 뒤 스페이스바로 놓습니다. Esc로 취소합니다.' },
            }}
          >
            {showUnclassified && <div className="mb-4">{renderColumn('unclassified')}</div>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {renderColumn('commercial')}
              {renderColumn('retail')}
            </div>
            <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
              {active ? <CardBody item={active} overlay /> : null}
            </DragOverlay>
          </DndContext>
        </>
      )}

      <Modal open={Boolean(menuItem)} onClose={() => setMenuFor(null)} title={menuItem?.title ?? ''} size="sm">
        {menuItem && (
          <div className="-mx-2 space-y-1">
            <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-gray-500">분류 이동</p>
            {COLUMN_IDS.filter((column) => column !== menuColumn).map((column) => (
              <MenuButton key={column} icon={<ArrowRightLeft className="h-4 w-4" />} onClick={() => moveTo(menuItem.id, column)}>
                {COLUMN_META[column].title}(으)로 이동
              </MenuButton>
            ))}
            <div className="my-2 border-t border-white/[0.06]" />
            <MenuButton
              icon={menuItem.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              onClick={() => updateItem(menuItem, { is_published: !menuItem.is_published }, menuItem.is_published ? '비공개로 전환했습니다.' : '공개했습니다.')}
            >
              {menuItem.is_published ? '비공개로 전환' : '공개하기'}
            </MenuButton>
            <MenuButton
              icon={<Star className="h-4 w-4" />}
              onClick={() => updateItem(menuItem, { is_featured: !menuItem.is_featured }, menuItem.is_featured ? '추천을 해제했습니다.' : '홈 화면 추천으로 설정했습니다.')}
            >
              {menuItem.is_featured ? '추천 해제' : '추천 (홈 화면 노출)'}
            </MenuButton>
            <MenuButton icon={<Pencil className="h-4 w-4" />} href={`/admin/portfolios/${menuItem.id}/edit`}>
              수정하기
            </MenuButton>
            <MenuButton icon={<Trash2 className="h-4 w-4" />} danger onClick={() => remove(menuItem)}>
              삭제
            </MenuButton>
          </div>
        )}
      </Modal>
    </div>
  );
}

interface BoardColumnProps {
  column: ColumnId;
  ids: string[];
  items: Map<string, Portfolio>;
  dragDisabled: boolean;
  searching: boolean;
  onMenu: (id: string) => void;
  onToggle: (item: Portfolio, patch: Partial<Portfolio>, message: string) => void;
  minHeight?: number;
  elementRef: (element: HTMLElement | null) => void;
}

function BoardColumn({ column, ids, items, dragDisabled, searching, onMenu, onToggle, minHeight, elementRef }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column, disabled: dragDisabled });
  const meta = COLUMN_META[column];
  const projectType = columnType(column);

  return (
    <section
      ref={elementRef}
      style={{ minHeight }}
      className={cn(
        'flex flex-col rounded-2xl border p-3 transition-colors',
        column === 'unclassified' ? 'border-dashed border-amber-500/25 bg-amber-500/[0.03]' : 'border-white/10 bg-[#101010]',
        isOver && 'border-primary/50 bg-primary/[0.04]',
      )}
      aria-label={meta.title}
    >
      <header className="flex items-center justify-between gap-2 px-1 pb-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            {meta.title}
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-xs font-medium text-gray-400">{ids.length}</span>
          </h2>
          {meta.hint && <p className="mt-0.5 text-xs text-amber-400/80">{meta.hint}</p>}
        </div>
        {projectType && (
          <Link
            href={`/admin/portfolios/new?type=${projectType}`}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
            aria-label={`${meta.title}에 새 프로젝트 추가`}
          >
            <Plus className="h-4 w-4" />
          </Link>
        )}
      </header>

      <SortableContext id={column} items={ids} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-2">
          {ids.map((id) => {
            const item = items.get(id);
            return item ? <SortableCard key={id} item={item} disabled={dragDisabled} onMenu={onMenu} onToggle={onToggle} /> : null;
          })}
          {ids.length === 0 && (
            <li className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-gray-600">
              {searching ? '검색 결과 없음' : '여기로 끌어다 놓으세요'}
            </li>
          )}
        </ul>
      </SortableContext>
    </section>
  );
}

interface SortableCardProps {
  item: Portfolio;
  disabled: boolean;
  onMenu: (id: string) => void;
  onToggle: (item: Portfolio, patch: Partial<Portfolio>, message: string) => void;
}

function SortableCard({ item, disabled, onMenu, onToggle }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && 'opacity-30')}
    >
      <CardBody
        item={item}
        handle={
          disabled ? null : (
            <button
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              className="flex h-full w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-gray-600 hover:bg-white/5 hover:text-gray-300 active:cursor-grabbing"
              aria-label={`${item.title} 이동`}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )
        }
        actions={
          <>
            <button
              onClick={() => onToggle(item, { is_published: !item.is_published }, item.is_published ? '비공개로 전환했습니다.' : '공개했습니다.')}
              className={cn('hidden rounded-lg p-2 transition-colors sm:inline-flex', item.is_published ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-white/5 hover:text-white')}
              aria-label={item.is_published ? '비공개로 전환' : '공개하기'}
              title={item.is_published ? '공개 중 · 눌러서 비공개' : '비공개 · 눌러서 공개'}
            >
              {item.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button
              onClick={() => onToggle(item, { is_featured: !item.is_featured }, item.is_featured ? '추천을 해제했습니다.' : '홈 화면 추천으로 설정했습니다.')}
              className={cn('hidden rounded-lg p-2 transition-colors sm:inline-flex', item.is_featured ? 'text-amber-400 hover:bg-amber-400/10' : 'text-gray-600 hover:bg-white/5 hover:text-white')}
              aria-label={item.is_featured ? '추천 해제' : '추천 설정'}
              title={item.is_featured ? '홈 화면 추천 중' : '홈 화면 추천 안 함'}
            >
              <Star className={cn('h-4 w-4', item.is_featured && 'fill-current')} />
            </button>
            <button onClick={() => onMenu(item.id)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white" aria-label={`${item.title} 메뉴`}>
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </>
        }
      />
    </li>
  );
}

interface CardBodyProps {
  item: Portfolio;
  handle?: React.ReactNode;
  actions?: React.ReactNode;
  overlay?: boolean;
}

function CardBody({ item, handle, actions, overlay = false }: CardBodyProps) {
  return (
    <div
      className={cn(
        'flex items-stretch gap-2 rounded-xl border border-white/[0.07] bg-[#181818] p-2 pr-1',
        overlay && 'cursor-grabbing border-primary/40 shadow-2xl shadow-black/60 ring-1 ring-primary/30',
      )}
    >
      {overlay ? <div className="flex w-8 shrink-0 items-center justify-center text-gray-400"><GripVertical className="h-4 w-4" /></div> : handle}
      <AdminThumb src={item.thumbnail_url || item.image_url} alt="" className="h-14 w-14 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {overlay ? (
          <p className="truncate font-medium text-white">{item.title}</p>
        ) : (
          <Link href={`/admin/portfolios/${item.id}/edit`} className="truncate font-medium text-white hover:underline">
            {item.title}
          </Link>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {item.category && <span className="truncate text-xs text-gray-500">{item.category}</span>}
          {!item.is_published && <Badge>비공개</Badge>}
          {item.is_featured && <Badge tone="warning">추천</Badge>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center">{actions}</div>}
    </div>
  );
}

interface MenuButtonProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
}

function MenuButton({ icon, children, onClick, href, danger = false }: MenuButtonProps) {
  const className = cn(
    'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors',
    danger ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-200 hover:bg-white/[0.06]',
  );
  if (href) {
    return <Link href={href} className={className}>{icon}{children}</Link>;
  }
  return <button type="button" className={className} onClick={onClick}>{icon}{children}</button>;
}
