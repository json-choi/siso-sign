'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/admin/RichTextEditor';
import MultiImageUpload from '@/components/admin/MultiImageUpload';
import type { Portfolio } from '@/types/database';

type PageProps = { params: Promise<{ id: string }> };

export default function EditPortfolioPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    fetchPortfolio();
  }, [id]);

  const fetchPortfolio = async () => {
    try {
      const res = await fetch(`/api/admin/portfolios/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data);
        setDescription(data.description || '');
        setImages(data.images || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    const data = {
      title: formData.get('title'),
      description: description,
      category: formData.get('category'),
      images: images,
      image_url: images[0] || null,
      is_featured: formData.get('is_featured') === 'on',
      is_published: formData.get('is_published') === 'on',
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
    };

    try {
      const res = await fetch(`/api/admin/portfolios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push('/admin/portfolios');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    await fetch(`/api/admin/portfolios/${id}`, { method: 'DELETE' });
    router.push('/admin/portfolios');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-gray-400 mb-4">포트폴리오를 찾을 수 없습니다.</p>
        <Link href="/admin/portfolios" className="text-primary hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/portfolios"
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white">포트폴리오 수정</h1>
        </div>
        <button
          onClick={handleDelete}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
          title="삭제"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
              <h2 className="text-lg font-semibold text-white mb-4">기본 정보</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={portfolio.title}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary text-base"
                    placeholder="프로젝트 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    카테고리
                  </label>
                  <input
                    type="text"
                    name="category"
                    defaultValue={portfolio.category || ''}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary text-base"
                    placeholder="예: Branding, Signage, Exhibition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    설명
                  </label>
                  <RichTextEditor
                    content={description}
                    onChange={setDescription}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
              <h2 className="text-lg font-semibold text-white mb-4">이미지</h2>
              <MultiImageUpload value={images} onChange={setImages} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
              <h2 className="text-lg font-semibold text-white mb-4">설정</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    정렬 순서
                  </label>
                  <input
                    type="number"
                    name="sort_order"
                    defaultValue={portfolio.sort_order}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary text-base"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_published"
                      defaultChecked={portfolio.is_published}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                    />
                    <span className="text-white">공개</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_featured"
                      defaultChecked={portfolio.is_featured}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                    />
                    <span className="text-white">추천 (홈페이지 노출)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
              <h2 className="text-lg font-semibold text-white mb-2">정보</h2>
              <div className="text-sm text-gray-400 space-y-1">
                <p>생성: {new Date(portfolio.created_at).toLocaleDateString('ko-KR')}</p>
                <p>수정: {new Date(portfolio.updated_at).toLocaleDateString('ko-KR')}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {isSubmitting ? '저장 중...' : '저장하기'}
              </button>

              <Link
                href="/admin/portfolios"
                className="w-full flex items-center justify-center px-4 py-3 border border-white/10 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
              >
                취소
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
