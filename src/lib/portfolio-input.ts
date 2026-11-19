import { isProjectType } from '@/lib/project-types';

const editableFields = [
  'title', 'description', 'category', 'project_type', 'image_url', 'images',
  'thumbnail_url', 'tags', 'is_featured', 'is_published', 'sort_order',
] as const;

type PortfolioInput = Record<string, unknown>;

/** Keeps editable portfolio fields and rejects values the database would refuse with a vague error. */
export function parsePortfolioInput(body: unknown, { requireTitle }: { requireTitle: boolean }): { data: PortfolioInput } | { error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: '유효하지 않은 데이터입니다.' };
  const source = body as Record<string, unknown>;
  const data: PortfolioInput = {};
  for (const field of editableFields) {
    if (field in source) data[field] = source[field];
  }

  if ('title' in data || requireTitle) {
    if (typeof data.title !== 'string' || !data.title.trim()) return { error: '제목을 입력하세요.' };
    data.title = data.title.trim();
  }
  if ('project_type' in data && data.project_type !== null && !isProjectType(data.project_type)) {
    return { error: '프로젝트 분류가 올바르지 않습니다.' };
  }
  if ('sort_order' in data && !Number.isSafeInteger(data.sort_order)) {
    return { error: '정렬 순서가 올바르지 않습니다.' };
  }
  return { data };
}
