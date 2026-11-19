'use client';

import { useCallback, useEffect, useState } from 'react';
import { useFeedback } from '@/components/admin/AdminFeedback';
import { adminRequest, errorMessage } from '@/lib/admin-api';
import type { SiteSetting } from '@/types/database';

interface SettingsDraft {
  settings: SiteSetting[] | null;
  loadError: string;
  reload: () => void;
  value: (key: string) => string;
  change: (key: string, value: string) => void;
  isDirty: (key: string) => boolean;
  dirtyCount: number;
  saving: boolean;
  save: () => Promise<void>;
  discard: () => void;
}

/** Loads site settings and batches edits so they are saved together. */
export function useSettingsDraft(defaults: Record<string, string> = {}): SettingsDraft {
  const feedback = useFeedback();
  const [settings, setSettings] = useState<SiteSetting[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      setSettings(await adminRequest<SiteSetting[]>('/api/admin/settings'));
    } catch (error) {
      setLoadError(errorMessage(error, '설정을 불러오지 못했습니다.'));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const stored = useCallback(
    (key: string) => {
      const row = settings?.find((setting) => setting.key === key);
      return row ? row.value ?? '' : defaults[key] ?? '';
    },
    [settings, defaults],
  );

  const dirtyKeys = Object.keys(edits).filter((key) => edits[key] !== stored(key));

  useEffect(() => {
    if (!dirtyKeys.length) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirtyKeys.length]);

  const save = async () => {
    if (!dirtyKeys.length) return;
    setSaving(true);
    try {
      const rows = dirtyKeys.map((key) => ({ key, value: edits[key] }));
      const saved = await adminRequest<SiteSetting[]>('/api/admin/settings', { method: 'POST', json: rows });
      setSettings((current) => {
        const next = [...(current ?? [])];
        for (const row of saved) {
          const index = next.findIndex((setting) => setting.key === row.key);
          if (index === -1) next.push(row);
          else next[index] = row;
        }
        return next;
      });
      setEdits({});
      feedback.success(`${rows.length}개 항목을 저장했습니다.`);
    } catch (error) {
      feedback.error(errorMessage(error, '저장하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loadError,
    reload: () => void load(),
    value: (key) => edits[key] ?? stored(key),
    change: (key, value) => setEdits((current) => ({ ...current, [key]: value })),
    isDirty: (key) => key in edits && edits[key] !== stored(key),
    dirtyCount: dirtyKeys.length,
    saving,
    save,
    discard: () => setEdits({}),
  };
}
