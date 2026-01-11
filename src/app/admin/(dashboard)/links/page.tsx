'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GripVertical, ExternalLink } from 'lucide-react';
import type { SocialLink } from '@/types/database';

export default function LinksPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<SocialLink | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/admin/links');
      const data = await res.json();
      setLinks(Array.isArray(data) ? data : []);
    } catch {
      setLinks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    await fetch(`/api/admin/links/${id}`, { method: 'DELETE' });
    fetchLinks();
  };

  const openModal = (item?: SocialLink) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      platform: formData.get('platform'),
      url: formData.get('url'),
      icon: formData.get('icon'),
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
      is_active: formData.get('is_active') === 'on',
    };

    if (editingItem) {
      await fetch(`/api/admin/links/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/admin/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }

    closeModal();
    fetchLinks();
  };

  if (isLoading) {
    return <div className="text-white">로딩 중...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">소셜 링크 관리</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          새 링크
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">순서</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">플랫폼</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">URL</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">상태</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">작업</th>
            </tr>
          </thead>
          <tbody>
            {links.map((item) => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <GripVertical className="w-4 h-4" />
                    {item.sort_order}
                  </div>
                </td>
                <td className="px-6 py-4 text-white font-medium">{item.platform}</td>
                <td className="px-6 py-4">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    {item.url.length > 40 ? `${item.url.slice(0, 40)}...` : item.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded ${item.is_active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                    {item.is_active ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openModal(item)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
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

        {links.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            등록된 소셜 링크가 없습니다.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? '링크 수정' : '새 링크'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">플랫폼</label>
                <input
                  type="text"
                  name="platform"
                  defaultValue={editingItem?.platform || ''}
                  required
                  placeholder="예: Instagram, Facebook, KakaoTalk"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">URL</label>
                <input
                  type="url"
                  name="url"
                  defaultValue={editingItem?.url || ''}
                  required
                  placeholder="https://"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">아이콘 (Lucide 아이콘명)</label>
                <input
                  type="text"
                  name="icon"
                  defaultValue={editingItem?.icon || ''}
                  placeholder="예: Instagram, Facebook, MessageCircle"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">정렬 순서</label>
                <input
                  type="number"
                  name="sort_order"
                  defaultValue={editingItem?.sort_order || 0}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-gray-400">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={editingItem?.is_active ?? true}
                    className="rounded border-white/20"
                  />
                  활성화
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 border border-white/10 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {editingItem ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
