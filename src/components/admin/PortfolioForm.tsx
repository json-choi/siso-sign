'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useFeedback } from '@/components/admin/AdminFeedback';
import MultiImageUpload from '@/components/admin/MultiImageUpload';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { Button, ButtonLink, Card, Field, PageHeader, Switch, TextInput } from '@/components/admin/ui';
import { adminRequest, errorMessage } from '@/lib/admin-api';
import { cn } from '@/lib/cn';
import { PROJECT_TYPES, PROJECT_TYPE_LABELS, toProjectType } from '@/lib/project-types';
import type { ProjectType } from '@/lib/project-types';
import type { Portfolio } from '@/types/database';

interface FormState {
  title: string;
  category: string;
  project_type: ProjectType | null;
  description: string;
  images: string[];
  is_published: boolean;
  is_featured: boolean;
}

function initialState(portfolio: Portfolio | null, defaultType: ProjectType | null): FormState {
  return {
    title: portfolio?.title ?? '',
    category: portfolio?.category ?? '',
    project_type: portfolio ? toProjectType(portfolio.project_type) : defaultType,
    description: portfolio?.description ?? '',
    images: portfolio?.images?.length ? portfolio.images : portfolio?.image_url ? [portfolio.image_url] : [],
    is_published: portfolio?.is_published ?? true,
    is_featured: portfolio?.is_featured ?? false,
  };
}

interface PortfolioFormProps {
  portfolio: Portfolio | null;
  defaultType?: ProjectType | null;
}

export default function PortfolioForm({ portfolio, defaultType = null }: PortfolioFormProps) {
  const router = useRouter();
  const feedback = useFeedback();
  const [initial] = useState(() => initialState(portfolio, defaultType));
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  useEffect(() => {
    if (!dirty || saving) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) {
      feedback.error('제목을 입력하세요.');
      return;
    }
    setSaving(true);
    const body = {
      title: form.title.trim(),
      category: form.category.trim() || null,
      project_type: form.project_type,
      description: form.description,
      images: form.images,
      image_url: form.images[0] ?? null,
      is_published: form.is_published,
      is_featured: form.is_featured,
    };
    try {
      if (portfolio) {
        await adminRequest(`/api/admin/portfolios/${portfolio.id}`, { method: 'PUT', json: body });
      } else {
        await adminRequest('/api/admin/portfolios', { method: 'POST', json: body });
      }
      feedback.success(portfolio ? '저장했습니다.' : '프로젝트를 추가했습니다.');
      router.push('/admin/portfolios');
      router.refresh();
    } catch (error) {
      feedback.error(errorMessage(error, '저장하지 못했습니다.'));
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!portfolio) return;
    const ok = await feedback.confirm({
      title: '프로젝트를 삭제할까요?',
      description: `"${portfolio.title}"을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.`,
      confirmLabel: '삭제',
      danger: true,
    });
    if (!ok) return;
    try {
      await adminRequest(`/api/admin/portfolios/${portfolio.id}`, { method: 'DELETE' });
      feedback.success('삭제했습니다.');
      setSaving(true);
      router.push('/admin/portfolios');
      router.refresh();
    } catch (error) {
      feedback.error(errorMessage(error, '삭제하지 못했습니다.'));
    }
  };

  const typeOptions: { value: ProjectType | null; label: string }[] = [
    ...PROJECT_TYPES.map((type) => ({ value: type, label: PROJECT_TYPE_LABELS[type] })),
    { value: null, label: '미분류' },
  ];

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl">
      <PageHeader
        title={portfolio ? '프로젝트 수정' : '새 프로젝트'}
        back={
          <ButtonLink href="/admin/portfolios" variant="ghost" size="icon" className="-ml-2 shrink-0" aria-label="목록으로">
            <ArrowLeft className="h-5 w-5" />
          </ButtonLink>
        }
        actions={
          <div className="hidden items-center gap-2 lg:flex">
            {portfolio && (
              <Button variant="ghost" onClick={handleDelete} className="hover:text-red-400">
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
            )}
            <Button type="submit" variant="primary" loading={saving}>저장</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 lg:col-span-2 lg:space-y-6">
          <Card title="기본 정보">
            <div className="space-y-5">
              <Field label="제목" required>
                {(id) => (
                  <TextInput id={id} value={form.title} onChange={(event) => set('title', event.target.value)} placeholder="프로젝트 이름" required autoFocus={!portfolio} />
                )}
              </Field>
              <Field label="카테고리" hint="작업 종류를 적어주세요. 프로젝트 카드에 함께 표시됩니다.">
                {(id) => (
                  <TextInput id={id} value={form.category} onChange={(event) => set('category', event.target.value)} placeholder="예: Signage, Branding" />
                )}
              </Field>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-300">설명</p>
                <RichTextEditor content={form.description} onChange={(html) => set('description', html)} />
              </div>
            </div>
          </Card>

          <Card title="사진" description="최대 10장 · 자동으로 압축됩니다.">
            <MultiImageUpload value={form.images} onChange={(images) => set('images', images)} />
          </Card>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <Card title="프로젝트 분류">
            <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="프로젝트 분류">
              {typeOptions.map((option) => {
                const selected = form.project_type === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set('project_type', option.value)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                      selected ? 'border-primary bg-primary/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white',
                      option.value === null && !selected && 'border-dashed',
                    )}
                  >
                    <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', selected ? 'border-primary' : 'border-white/30')}>
                      {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-gray-500">목록 화면에서 카드를 끌어 분류와 순서를 바꿀 수도 있습니다.</p>
          </Card>

          <Card title="노출">
            <div className="space-y-4">
              <Switch checked={form.is_published} onChange={(value) => set('is_published', value)} label="공개" description="끄면 사이트에 보이지 않습니다." />
              <Switch checked={form.is_featured} onChange={(value) => set('is_featured', value)} label="추천" description="홈 화면에 노출합니다." />
            </div>
          </Card>

          {portfolio && (
            <p className="px-1 text-xs text-gray-500">
              생성 {new Date(portfolio.created_at).toLocaleDateString('ko-KR')} · 수정 {new Date(portfolio.updated_at).toLocaleDateString('ko-KR')}
            </p>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-30 -mx-4 mt-6 flex gap-2 border-t border-white/10 bg-[#0a0a0a]/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {portfolio && (
          <Button variant="secondary" size="icon" className="h-11 w-11" onClick={handleDelete} aria-label="삭제">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button type="submit" variant="primary" className="flex-1" loading={saving}>
          {dirty ? '저장' : '저장 (변경 없음)'}
        </Button>
      </div>
    </form>
  );
}
