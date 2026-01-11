'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, GripVertical } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Portfolio } from '@/types/database';

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const res = await fetch('/api/admin/portfolios');
      const data = await res.json();
      setPortfolios(Array.isArray(data) ? data : []);
    } catch {
      setPortfolios([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    await fetch(`/api/admin/portfolios/${id}`, { method: 'DELETE' });
    fetchPortfolios();
  };

  const handleTogglePublish = async (item: Portfolio) => {
    await fetch(`/api/admin/portfolios/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !item.is_published }),
    });
    fetchPortfolios();
  };

  const handleToggleFeatured = async (item: Portfolio) => {
    await fetch(`/api/admin/portfolios/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: !item.is_featured }),
    });
    fetchPortfolios();
  };

  if (isLoading) {
    return <div className="text-white">로딩 중...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">포트폴리오 관리</h1>
        <Link
          href="/admin/portfolios/new"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>새 포트폴리오</span>
        </Link>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">순서</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">이미지</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">제목</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">카테고리</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">상태</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">작업</th>
            </tr>
          </thead>
          <tbody>
            {portfolios.map((item) => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <GripVertical className="w-4 h-4" />
                    {item.sort_order}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {item.image_url && (
                    <div className="w-16 h-12 relative rounded overflow-hidden bg-white/10">
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-white font-medium">{item.title}</td>
                <td className="px-6 py-4 text-gray-400">{item.category || '-'}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePublish(item)}
                      className={`p-1.5 rounded ${item.is_published ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}
                      title={item.is_published ? '공개됨' : '비공개'}
                    >
                      {item.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleToggleFeatured(item)}
                      className={`p-1.5 rounded ${item.is_featured ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-500/20 text-gray-500'}`}
                      title={item.is_featured ? '추천됨' : '일반'}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/portfolios/${item.id}/edit`}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {portfolios.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            등록된 포트폴리오가 없습니다.
          </div>
        )}
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="md:hidden space-y-4">
        {portfolios.map((item) => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex gap-4">
              {item.image_url && (
                <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{item.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{item.category || '카테고리 없음'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${item.is_published ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                    {item.is_published ? '공개' : '비공개'}
                  </span>
                  {item.is_featured && (
                    <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500">
                      추천
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTogglePublish(item)}
                  className={`p-2 rounded ${item.is_published ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}
                >
                  {item.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleToggleFeatured(item)}
                  className={`p-2 rounded ${item.is_featured ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-500/20 text-gray-500'}`}
                >
                  <Star className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/portfolios/${item.id}/edit`}
                  className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white/5 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {portfolios.length === 0 && (
          <div className="p-12 text-center text-gray-400 bg-white/5 border border-white/10 rounded-xl">
            등록된 포트폴리오가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
