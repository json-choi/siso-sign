'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useFeedback } from '@/components/admin/AdminFeedback';
import { ABOUT_KEYS } from '@/components/admin/about-fields';
import ImageUploadField from '@/components/admin/ImageUploadField';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { Button, Card, ErrorState, Field, LoadingState, PageHeader, SaveBar, TextInput } from '@/components/admin/ui';
import { useSettingsDraft } from '@/components/admin/useSettingsDraft';
import { adminRequest, errorMessage } from '@/lib/admin-api';
import type { SiteSetting } from '@/types/database';

const GROUPS: { id: string; label: string; prefix: string | null }[] = [
  { id: 'site', label: '사이트 정보', prefix: 'site_' },
  { id: 'hero', label: '히어로 섹션', prefix: 'hero_' },
  { id: 'about', label: '소개', prefix: 'about_' },
  { id: 'contact', label: '연락처', prefix: 'contact_' },
  { id: 'business', label: '사업자 정보', prefix: 'business_' },
  { id: 'footer', label: '푸터', prefix: 'footer_' },
  { id: 'etc', label: '기타', prefix: null },
];

const isImageField = (key: string) => ['image', 'logo', 'thumbnail', 'photo'].some((word) => key.includes(word));
const isRichField = (key: string) => key.includes('text') || key.includes('description');

function groupOf(key: string): string {
  return GROUPS.find((group) => group.prefix && key.startsWith(group.prefix))?.id ?? 'etc';
}

export default function SettingsPage() {
  const draft = useSettingsDraft();

  if (draft.loadError) return <ErrorState message={draft.loadError} onRetry={draft.reload} />;
  if (!draft.settings) return <LoadingState rows={4} />;

  // Fields edited on the About page are not repeated here.
  const visible = draft.settings.filter((setting) => !ABOUT_KEYS.has(setting.key));
  const groups = GROUPS.map((group) => ({ ...group, items: visible.filter((setting) => groupOf(setting.key) === group.id) })).filter((group) => group.items.length);

  const renderInput = (setting: SiteSetting) => (
    <Field key={setting.key} label={setting.description || setting.key} dirty={draft.isDirty(setting.key)}>
      {(id) =>
        isRichField(setting.key) ? (
          <RichTextEditor content={draft.value(setting.key)} onChange={(html) => draft.change(setting.key, html)} />
        ) : isImageField(setting.key) ? (
          <ImageUploadField value={draft.value(setting.key)} onChange={(url) => draft.change(setting.key, url)} />
        ) : (
          <TextInput id={id} value={draft.value(setting.key)} onChange={(event) => draft.change(setting.key, event.target.value)} />
        )
      }
    </Field>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="사이트 설정" description="여러 항목을 고친 뒤 아래 저장 버튼으로 한 번에 저장하세요." />

      <nav className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0" aria-label="설정 구역">
        {[...groups, { id: 'password', label: '비밀번호' }].map((group) => (
          <a key={group.id} href={`#${group.id}`} className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:border-white/20 hover:text-white">
            {group.label}
          </a>
        ))}
      </nav>

      <div className="space-y-4 md:space-y-6">
        {groups.map((group) => (
          <Card key={group.id} id={group.id} title={group.label}>
            <div className="space-y-5">{group.items.map(renderInput)}</div>
          </Card>
        ))}
        <PasswordCard />
      </div>

      <SaveBar count={draft.dirtyCount} saving={draft.saving} onSave={() => void draft.save()} onDiscard={draft.discard} />
    </div>
  );
}

function PasswordCard() {
  const feedback = useFeedback();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (next.length < 6) return setError('새 비밀번호는 6자 이상이어야 합니다.');
    if (next !== confirm) return setError('새 비밀번호가 서로 다릅니다.');
    setSaving(true);
    try {
      await adminRequest('/api/admin/password', { method: 'PUT', json: { currentPassword: current, newPassword: next } });
      setCurrent('');
      setNext('');
      setConfirm('');
      feedback.success('비밀번호를 변경했습니다. 다음 로그인부터 새 비밀번호를 사용하세요.');
    } catch (err) {
      setError(errorMessage(err, '비밀번호를 변경하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const type = show ? 'text' : 'password';

  return (
    <Card
      id="password"
      title={<span className="flex items-center gap-2"><Lock className="h-4 w-4" />비밀번호 변경</span>}
      actions={
        <button type="button" onClick={() => setShow(!show)} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-gray-400 hover:text-white" aria-pressed={show}>
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {show ? '숨기기' : '보기'}
        </button>
      }
    >
      <form onSubmit={submit} className="max-w-md space-y-4">
        <Field label="현재 비밀번호">
          {(id) => <TextInput id={id} type={type} autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} required />}
        </Field>
        <Field label="새 비밀번호" hint="6자 이상">
          {(id) => <TextInput id={id} type={type} autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} required minLength={6} />}
        </Field>
        <Field label="새 비밀번호 확인">
          {(id) => <TextInput id={id} type={type} autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required />}
        </Field>
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        <Button type="submit" variant="primary" loading={saving} className="w-full sm:w-auto">비밀번호 변경</Button>
      </form>
    </Card>
  );
}
