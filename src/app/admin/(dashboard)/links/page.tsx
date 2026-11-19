'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { useFeedback } from '@/components/admin/AdminFeedback';
import Modal from '@/components/admin/Modal';
import SortableList from '@/components/admin/SortableList';
import { Badge, Button, EmptyState, ErrorState, Field, LoadingState, PageHeader, Switch, TextInput } from '@/components/admin/ui';
import { adminRequest, errorMessage } from '@/lib/admin-api';
import type { SocialLink } from '@/types/database';

interface Draft {
  platform: string;
  url: string;
  is_active: boolean;
}

const emptyDraft: Draft = { platform: '', url: '', is_active: true };
const suggestions = ['Instagram', 'Blog', 'YouTube', 'KakaoTalk', 'Facebook'];

export default function LinksPage() {
  const feedback = useFeedback();
  const [links, setLinks] = useState<SocialLink[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<SocialLink | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      setLinks(await adminRequest<SocialLink[]>('/api/admin/links'));
    } catch (error) {
      setLoadError(errorMessage(error, '링크를 불러오지 못했습니다.'));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const open = (item: SocialLink | 'new') => {
    setEditing(item);
    setDraft(item === 'new' ? emptyDraft : { platform: item.platform, url: item.url, is_active: item.is_active });
  };
  const close = useCallback(() => setEditing(null), []);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!links || !editing) return;
    setSaving(true);
    try {
      const body = { platform: draft.platform.trim(), url: draft.url.trim(), is_active: draft.is_active };
      if (editing === 'new') {
        const created = await adminRequest<SocialLink>('/api/admin/links', { method: 'POST', json: { ...body, sort_order: links.length } });
        setLinks([...links, created]);
      } else {
        const updated = await adminRequest<SocialLink>(`/api/admin/links/${editing.id}`, { method: 'PUT', json: body });
        setLinks(links.map((item) => (item.id === updated.id ? updated : item)));
      }
      feedback.success('저장했습니다.');
      setEditing(null);
    } catch (error) {
      feedback.error(errorMessage(error, '저장하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: SocialLink) => {
    if (!links) return;
    const next = { ...item, is_active: !item.is_active };
    setLinks(links.map((row) => (row.id === item.id ? next : row)));
    try {
      await adminRequest(`/api/admin/links/${item.id}`, { method: 'PUT', json: { is_active: next.is_active } });
    } catch (error) {
      setLinks((current) => current?.map((row) => (row.id === item.id ? item : row)) ?? null);
      feedback.error(errorMessage(error, '변경하지 못했습니다.'));
    }
  };

  const remove = async (item: SocialLink) => {
    const ok = await feedback.confirm({ title: '링크를 삭제할까요?', description: `${item.platform} 링크를 삭제합니다.`, confirmLabel: '삭제', danger: true });
    if (!ok) return;
    try {
      await adminRequest(`/api/admin/links/${item.id}`, { method: 'DELETE' });
      setLinks((current) => current?.filter((row) => row.id !== item.id) ?? null);
      feedback.success('삭제했습니다.');
    } catch (error) {
      feedback.error(errorMessage(error, '삭제하지 못했습니다.'));
    }
  };

  const reorder = async (next: SocialLink[]) => {
    const previous = links;
    setLinks(next);
    try {
      await adminRequest('/api/admin/links/order', { method: 'PUT', json: next.map((item) => item.id) });
    } catch (error) {
      setLinks(previous);
      feedback.error(errorMessage(error, '순서를 저장하지 못했습니다.'));
    }
  };

  if (loadError) return <ErrorState message={loadError} onRetry={() => void load()} />;
  if (!links) return <LoadingState />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="소셜 링크"
        description="사이트 하단과 홈 화면에 보이는 링크입니다. 항목을 잡고 끌어 순서를 바꾸세요."
        actions={<Button variant="primary" onClick={() => open('new')}><Plus className="h-4 w-4" />새 링크</Button>}
      />

      {links.length === 0 ? (
        <EmptyState title="등록된 링크가 없습니다" action={<Button variant="primary" onClick={() => open('new')}><Plus className="h-4 w-4" />새 링크</Button>} />
      ) : (
        <SortableList items={links} onReorder={(next) => void reorder(next)} label={(item) => item.platform}>
          {(item) => (
            <div className="flex items-center gap-3 pl-1">
              <button onClick={() => open(item)} className="min-w-0 flex-1 text-left">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium text-white">{item.platform}</span>
                  {!item.is_active && <Badge>숨김</Badge>}
                </span>
                <span className="mt-0.5 block truncate text-sm text-gray-500">{item.url}</span>
              </button>
              <div className="flex shrink-0 items-center">
                <span className="hidden sm:block"><Switch checked={item.is_active} onChange={() => void toggle(item)} label={<span className="sr-only">표시</span>} /></span>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="hidden h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-white/[0.06] hover:text-white sm:inline-flex" aria-label={`${item.platform} 열기`}>
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Button variant="ghost" size="icon" onClick={() => open(item)} aria-label={`${item.platform} 수정`}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="hover:text-red-400" onClick={() => void remove(item)} aria-label={`${item.platform} 삭제`}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </SortableList>
      )}

      <Modal
        open={editing !== null}
        onClose={close}
        title={editing === 'new' ? '새 링크' : '링크 수정'}
        footer={
          <>
            <Button className="flex-1" onClick={close}>취소</Button>
            <Button className="flex-1" variant="primary" type="submit" form="link-form" loading={saving}>저장</Button>
          </>
        }
      >
        <form id="link-form" onSubmit={save} className="space-y-5">
          <Field label="이름" required>
            {(id) => (
              <>
                <TextInput id={id} value={draft.platform} onChange={(event) => setDraft({ ...draft, platform: event.target.value })} placeholder="예: Instagram" required />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {suggestions.map((name) => (
                    <button key={name} type="button" onClick={() => setDraft({ ...draft, platform: name })} className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white">
                      {name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </Field>
          <Field label="주소" required>
            {(id) => <TextInput id={id} type="url" inputMode="url" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} placeholder="https://" required />}
          </Field>
          <Switch checked={draft.is_active} onChange={(value) => setDraft({ ...draft, is_active: value })} label="사이트에 표시" />
        </form>
      </Modal>
    </div>
  );
}
