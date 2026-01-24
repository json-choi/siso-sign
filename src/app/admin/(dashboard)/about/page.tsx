'use client';

import { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUploadField from '@/components/admin/ImageUploadField';
import type { SiteSetting } from '@/types/database';

const defaultValues: Record<string, string> = {
  about_title: 'About Us',
  about_description_1: '우리는 독창적인 디지털 경험을 창조하는 크리에이티브 스튜디오입니다...',
  about_description_2: '혁신과 탁월한 디자인을 바탕으로...',
  about_image_url: '',
  about_value_1_title: '진심',
  about_value_1_subtitle: 'Sincerity',
  about_value_2_title: '정확',
  about_value_2_subtitle: 'Accuracy',
  about_value_3_title: '안목',
  about_value_3_subtitle: 'Insight',
  about_value_4_title: '완벽',
  about_value_4_subtitle: 'Perfection',
};

const contentFields = [
  { key: 'about_title', label: '페이지 제목', type: 'text' },
  { key: 'about_description_1', label: '소개 첫 번째 문단', type: 'rich-text' },
  { key: 'about_description_2', label: '소개 두 번째 문단', type: 'rich-text' },
  { key: 'about_image_url', label: '이미지', type: 'image' },
];

const valueFields = [
  { key: 'about_value_1_title', label: '핵심 가치 1 - 제목', type: 'text' },
  { key: 'about_value_1_subtitle', label: '핵심 가치 1 - 서브타이틀', type: 'text' },
  { key: 'about_value_2_title', label: '핵심 가치 2 - 제목', type: 'text' },
  { key: 'about_value_2_subtitle', label: '핵심 가치 2 - 서브타이틀', type: 'text' },
  { key: 'about_value_3_title', label: '핵심 가치 3 - 제목', type: 'text' },
  { key: 'about_value_3_subtitle', label: '핵심 가치 3 - 서브타이틀', type: 'text' },
  { key: 'about_value_4_title', label: '핵심 가치 4 - 제목', type: 'text' },
  { key: 'about_value_4_subtitle', label: '핵심 가치 4 - 서브타이틀', type: 'text' },
];

export default function AboutPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      
      const settingsMap = (Array.isArray(data) ? data : []).reduce((acc: Record<string, string>, item: SiteSetting) => {
        if (item.key.startsWith('about_')) {
          acc[item.key] = item.value ?? '';
        }
        return acc;
      }, {});
      setSettings(settingsMap);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setSettings({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
    setSavedKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const getValue = (key: string) => {
    if (key in editedValues) return editedValues[key];
    if (key in settings) return settings[key];
    return defaultValues[key] ?? '';
  };

  const hasChanges = (key: string) => {
    return key in editedValues;
  };

  const handleSave = async (key: string) => {
    const value = getValue(key);
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      if (!res.ok) throw new Error('Failed to save');

      setSavedKeys((prev) => new Set(prev).add(key));
      
      setSettings((prev) => ({ ...prev, [key]: value }));
      
      setEditedValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      setTimeout(() => {
        setSavedKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to save setting:', error);
      alert('저장에 실패했습니다.');
    }
  };

  if (isLoading) {
    return <div className="text-white">로딩 중...</div>;
  }

  const renderField = (field: { key: string; label: string; type: string }) => (
    <div key={field.key}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <label className="text-sm font-medium text-gray-400">
          {field.label}
        </label>
        <button
          onClick={() => handleSave(field.key)}
          disabled={!hasChanges(field.key) && !savedKeys.has(field.key)}
          className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded text-sm transition-colors w-full sm:w-auto ${
            savedKeys.has(field.key)
              ? 'bg-green-500/20 text-green-500'
              : hasChanges(field.key)
              ? 'bg-primary text-black hover:bg-primary/90'
              : 'bg-white/5 text-gray-500 cursor-not-allowed'
          }`}
        >
          {savedKeys.has(field.key) ? (
            <>
              <Check className="w-4 h-4" />
              저장됨
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              저장
            </>
          )}
        </button>
      </div>
      {field.type === 'rich-text' ? (
        <RichTextEditor
          content={getValue(field.key)}
          onChange={(html) => handleChange(field.key, html)}
        />
      ) : field.type === 'image' ? (
        <ImageUploadField
          value={getValue(field.key)}
          onChange={(url) => handleChange(field.key, url)}
        />
      ) : (
        <input
          type="text"
          value={getValue(field.key)}
          onChange={(e) => handleChange(field.key, e.target.value)}
          className="w-full px-3 md:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary text-sm md:text-base"
        />
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">About 페이지 설정</h1>

      <div className="space-y-6 md:space-y-8">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">페이지 콘텐츠</h2>
          <div className="space-y-4 md:space-y-6">
            {contentFields.map(renderField)}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">핵심 가치</h2>
          <div className="space-y-4 md:space-y-6">
            {valueFields.map(renderField)}
          </div>
        </div>
      </div>
    </div>
  );
}
