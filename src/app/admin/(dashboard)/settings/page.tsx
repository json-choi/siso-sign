'use client';

import { useState, useEffect } from 'react';
import { Save, Check, Lock, Eye, EyeOff } from 'lucide-react';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUploadField from '@/components/admin/ImageUploadField';
import type { SiteSetting } from '@/types/database';

const isImageField = (key: string) => {
  return key.includes('image') || key.includes('logo') || key.includes('thumbnail') || key.includes('photo');
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      setSettings(Array.isArray(data) ? data : []);
    } catch {
      setSettings([]);
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

  const handleSave = async (setting: SiteSetting) => {
    const value = editedValues[setting.key] ?? setting.value;
    
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: setting.key, value }),
    });

    setSavedKeys((prev) => new Set(prev).add(setting.key));
    
    setSettings((prev) =>
      prev.map((s) => (s.key === setting.key ? { ...s, value } : s))
    );
    
    setEditedValues((prev) => {
      const next = { ...prev };
      delete next[setting.key];
      return next;
    });

    setTimeout(() => {
      setSavedKeys((prev) => {
        const next = new Set(prev);
        next.delete(setting.key);
        return next;
      });
    }, 2000);
  };

  const getDisplayValue = (setting: SiteSetting) => {
    return editedValues[setting.key] ?? setting.value ?? '';
  };

  const hasChanges = (key: string) => {
    return key in editedValues;
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || '비밀번호 변경에 실패했습니다.');
        return;
      }

      setPasswordSuccess('비밀번호가 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch {
      setPasswordError('서버 오류가 발생했습니다.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return <div className="text-white">로딩 중...</div>;
  }

  const groupOrder = [
    '사이트 정보',
    '히어로 섹션',
    '소개',
    '연락처',
    '사업자 정보',
    '푸터',
    '기타',
  ];

  const groupedSettings = settings.reduce((acc, setting) => {
    let group = '기타';
    if (setting.key.startsWith('site_')) group = '사이트 정보';
    else if (setting.key.startsWith('hero_')) group = '히어로 섹션';
    else if (setting.key.startsWith('about_')) group = '소개';
    else if (setting.key.startsWith('contact_')) group = '연락처';
    else if (setting.key.startsWith('business_')) group = '사업자 정보';
    else if (setting.key.startsWith('footer_')) group = '푸터';
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(setting);
    return acc;
  }, {} as Record<string, SiteSetting[]>);

  const sortedGroups = Object.entries(groupedSettings).sort(
    ([a], [b]) => groupOrder.indexOf(a) - groupOrder.indexOf(b)
  );

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">사이트 설정</h1>

      <div className="space-y-6 md:space-y-8">
        {sortedGroups.map(([group, groupSettings]) => (
          <div key={group} className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">{group}</h2>
            <div className="space-y-4 md:space-y-6">
              {groupSettings.map((setting) => (
                <div key={setting.key}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-400">
                      {setting.description || setting.key}
                    </label>
                    <button
                      onClick={() => handleSave(setting)}
                      disabled={!hasChanges(setting.key) && !savedKeys.has(setting.key)}
                      className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded text-sm transition-colors w-full sm:w-auto ${
                        savedKeys.has(setting.key)
                          ? 'bg-green-500/20 text-green-500'
                          : hasChanges(setting.key)
                          ? 'bg-primary text-black hover:bg-primary/90'
                          : 'bg-white/5 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {savedKeys.has(setting.key) ? (
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
                  {setting.key.includes('text') || setting.key.includes('description') ? (
                    <RichTextEditor
                      content={getDisplayValue(setting)}
                      onChange={(html) => handleChange(setting.key, html)}
                    />
                  ) : isImageField(setting.key) ? (
                    <ImageUploadField
                      value={getDisplayValue(setting)}
                      onChange={(url) => handleChange(setting.key, url)}
                    />
                  ) : (
                    <input
                      type="text"
                      value={getDisplayValue(setting)}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                      className="w-full px-3 md:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary text-sm md:text-base"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            비밀번호 변경
          </h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                현재 비밀번호
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary text-sm md:text-base pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                새 비밀번호
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary text-sm md:text-base pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 md:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary text-sm md:text-base"
              />
            </div>

            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}

            {passwordSuccess && (
              <p className="text-sm text-green-500">{passwordSuccess}</p>
            )}

            <button
              onClick={handlePasswordChange}
              disabled={isChangingPassword}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
            </button>

            <p className="text-xs text-gray-500">
              비밀번호는 최소 6자 이상이어야 합니다. 변경 후에는 새 비밀번호로 로그인하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
