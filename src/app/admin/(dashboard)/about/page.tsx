'use client';

import { ExternalLink } from 'lucide-react';
import { ABOUT_DEFAULTS } from '@/components/admin/about-fields';
import IconPicker from '@/components/admin/IconPicker';
import ImageUploadField from '@/components/admin/ImageUploadField';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { ButtonLink, Card, ErrorState, Field, LoadingState, PageHeader, SaveBar, TextInput } from '@/components/admin/ui';
import { useSettingsDraft } from '@/components/admin/useSettingsDraft';

const VALUES = [1, 2, 3, 4] as const;

export default function AboutSettingsPage() {
  const draft = useSettingsDraft(ABOUT_DEFAULTS);

  if (draft.loadError) return <ErrorState message={draft.loadError} onRetry={draft.reload} />;
  if (!draft.settings) return <LoadingState rows={4} />;

  const text = (key: string, label: string) => (
    <Field label={label} dirty={draft.isDirty(key)}>
      {(id) => <TextInput id={id} value={draft.value(key)} onChange={(event) => draft.change(key, event.target.value)} />}
    </Field>
  );

  const rich = (key: string, label: string) => (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
        {label}
        {draft.isDirty(key) && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="저장되지 않은 변경" />}
      </p>
      <RichTextEditor content={draft.value(key)} onChange={(html) => draft.change(key, html)} />
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="About 페이지"
        description="회사 소개와 핵심 가치를 수정합니다."
        actions={
          <ButtonLink href="/about" target="_blank" rel="noopener noreferrer" size="sm" variant="ghost">
            <ExternalLink className="h-4 w-4" />
            페이지 보기
          </ButtonLink>
        }
      />

      <div className="space-y-4 md:space-y-6">
        <Card title="소개">
          <div className="space-y-5">
            {text('about_title', '페이지 제목')}
            {rich('about_description_1', '첫 번째 문단')}
            {rich('about_description_2', '두 번째 문단')}
            <Field label="대표 이미지" dirty={draft.isDirty('about_image_url')}>
              {() => <ImageUploadField value={draft.value('about_image_url')} onChange={(url) => draft.change('about_image_url', url)} />}
            </Field>
          </div>
        </Card>

        <Card title="핵심 가치" description="About 페이지에 카드 4개로 표시됩니다.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {VALUES.map((number) => (
              <div key={number} className="space-y-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">가치 {number}</p>
                <Field label="아이콘" dirty={draft.isDirty(`about_value_${number}_icon`)}>
                  {() => <IconPicker value={draft.value(`about_value_${number}_icon`)} onChange={(icon) => draft.change(`about_value_${number}_icon`, icon)} />}
                </Field>
                {text(`about_value_${number}_title`, '제목')}
                {text(`about_value_${number}_subtitle`, '영문 부제')}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <SaveBar count={draft.dirtyCount} saving={draft.saving} onSave={() => void draft.save()} onDiscard={draft.discard} />
    </div>
  );
}
