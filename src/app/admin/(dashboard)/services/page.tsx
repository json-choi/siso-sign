'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useFeedback } from '@/components/admin/AdminFeedback';
import Modal from '@/components/admin/Modal';
import RichTextEditor from '@/components/admin/RichTextEditor';
import SortableList from '@/components/admin/SortableList';
import { Badge, Button, EmptyState, ErrorState, Field, LoadingState, PageHeader, Switch, TextInput } from '@/components/admin/ui';
import { adminRequest, errorMessage } from '@/lib/admin-api';
import { cn } from '@/lib/cn';
import { SERVICE_ICONS } from '@/lib/service-icons';
import { toPlainText } from '@/lib/text';
import type { Service } from '@/types/database';

interface Draft {
  title: string;
  description: string;
  icon: string;
  is_active: boolean;
}

const emptyDraft: Draft = { title: '', description: '', icon: 'Palette', is_active: true };

export default function ServicesPage() {
  const feedback = useFeedback();
  const [services, setServices] = useState<Service[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<Service | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      setServices(await adminRequest<Service[]>('/api/admin/services'));
    } catch (error) {
      setLoadError(errorMessage(error, '서비스를 불러오지 못했습니다.'));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const open = (item: Service | 'new') => {
    setEditing(item);
    setDraft(item === 'new' ? emptyDraft : { title: item.title, description: item.description ?? '', icon: item.icon ?? '', is_active: item.is_active });
  };
  const close = useCallback(() => setEditing(null), []);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!services || !editing) return;
    setSaving(true);
    try {
      const body = { ...draft, title: draft.title.trim(), icon: draft.icon || null };
      if (editing === 'new') {
        const created = await adminRequest<Service>('/api/admin/services', { method: 'POST', json: { ...body, sort_order: services.length } });
        setServices([...services, created]);
      } else {
        const updated = await adminRequest<Service>(`/api/admin/services/${editing.id}`, { method: 'PUT', json: body });
        setServices(services.map((item) => (item.id === updated.id ? updated : item)));
      }
      feedback.success('저장했습니다.');
      setEditing(null);
    } catch (error) {
      feedback.error(errorMessage(error, '저장하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: Service) => {
    if (!services) return;
    const next = { ...item, is_active: !item.is_active };
    setServices(services.map((row) => (row.id === item.id ? next : row)));
    try {
      await adminRequest(`/api/admin/services/${item.id}`, { method: 'PUT', json: { is_active: next.is_active } });
    } catch (error) {
      setServices((current) => current?.map((row) => (row.id === item.id ? item : row)) ?? null);
      feedback.error(errorMessage(error, '변경하지 못했습니다.'));
    }
  };

  const remove = async (item: Service) => {
    const ok = await feedback.confirm({ title: '서비스를 삭제할까요?', description: `"${item.title}"을(를) 삭제합니다.`, confirmLabel: '삭제', danger: true });
    if (!ok) return;
    try {
      await adminRequest(`/api/admin/services/${item.id}`, { method: 'DELETE' });
      setServices((current) => current?.filter((row) => row.id !== item.id) ?? null);
      feedback.success('삭제했습니다.');
    } catch (error) {
      feedback.error(errorMessage(error, '삭제하지 못했습니다.'));
    }
  };

  const reorder = async (next: Service[]) => {
    const previous = services;
    setServices(next);
    try {
      await adminRequest('/api/admin/services/order', { method: 'PUT', json: next.map((item) => item.id) });
    } catch (error) {
      setServices(previous);
      feedback.error(errorMessage(error, '순서를 저장하지 못했습니다.'));
    }
  };

  if (loadError) return <ErrorState message={loadError} onRetry={() => void load()} />;
  if (!services) return <LoadingState />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="서비스"
        description="서비스 페이지에 보이는 항목입니다. 왼쪽 손잡이를 끌어 순서를 바꾸세요."
        actions={<Button variant="primary" onClick={() => open('new')}><Plus className="h-4 w-4" />새 서비스</Button>}
      />

      {services.length === 0 ? (
        <EmptyState title="등록된 서비스가 없습니다" action={<Button variant="primary" onClick={() => open('new')}><Plus className="h-4 w-4" />새 서비스</Button>} />
      ) : (
        <SortableList items={services} onReorder={(next) => void reorder(next)} label={(item) => item.title}>
          {(item) => {
            const Icon = (item.icon && SERVICE_ICONS[item.icon]) || SERVICE_ICONS.Box;
            return (
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-gray-300">
                  <Icon className="h-5 w-5" />
                </span>
                <button onClick={() => open(item)} className="min-w-0 flex-1 text-left">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium text-white">{item.title}</span>
                    {!item.is_active && <Badge>숨김</Badge>}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-gray-500">{toPlainText(item.description) || '설명 없음'}</span>
                </button>
                <div className="flex shrink-0 items-center">
                  <span className="hidden sm:block"><Switch checked={item.is_active} onChange={() => void toggle(item)} label={<span className="sr-only">표시</span>} /></span>
                  <Button variant="ghost" size="icon" onClick={() => open(item)} aria-label={`${item.title} 수정`}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="hover:text-red-400" onClick={() => void remove(item)} aria-label={`${item.title} 삭제`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          }}
        </SortableList>
      )}

      <Modal
        open={editing !== null}
        onClose={close}
        title={editing === 'new' ? '새 서비스' : '서비스 수정'}
        footer={
          <>
            <Button className="flex-1" onClick={close}>취소</Button>
            <Button className="flex-1" variant="primary" type="submit" form="service-form" loading={saving}>저장</Button>
          </>
        }
      >
        <form id="service-form" onSubmit={save} className="space-y-5">
          <Field label="제목" required>
            {(id) => <TextInput id={id} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required />}
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-300">아이콘</p>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="아이콘">
              {Object.entries(SERVICE_ICONS).map(([name, Icon]) => (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={draft.icon === name}
                  aria-label={name}
                  onClick={() => setDraft({ ...draft, icon: name })}
                  className={cn(
                    'flex h-12 items-center justify-center rounded-lg border transition-colors',
                    draft.icon === name ? 'border-primary bg-primary/15 text-white' : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-300">설명</p>
            <RichTextEditor content={draft.description} onChange={(html) => setDraft((current) => ({ ...current, description: html }))} />
          </div>
          <Switch checked={draft.is_active} onChange={(value) => setDraft({ ...draft, is_active: value })} label="사이트에 표시" />
        </form>
      </Modal>
    </div>
  );
}
