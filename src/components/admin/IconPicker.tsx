'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { icons } from 'lucide-react';

const POPULAR_ICONS = [
  'Heart', 'Star', 'User', 'Target', 'Eye', 'CheckCircle', 'Award', 'Shield',
  'Zap', 'Lightbulb', 'Rocket', 'Crown', 'Diamond', 'Gem', 'Trophy', 'Medal',
  'ThumbsUp', 'Smile', 'Sun', 'Moon', 'Sparkles', 'Flame', 'Leaf', 'Globe',
  'Building', 'Home', 'Briefcase', 'Users', 'UserCheck', 'Handshake', 'Gift', 'Package',
  'PenTool', 'Palette', 'Layout', 'Layers', 'Box', 'Cube', 'Hexagon', 'Circle',
  'MessageCircle', 'Mail', 'Phone', 'MapPin', 'Clock', 'Calendar', 'Bell', 'Flag',
];

const allIconNames = Object.keys(icons);

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredIcons = useMemo(() => {
    let iconList: string[];

    if (search) {
      const searchLower = search.toLowerCase();
      iconList = allIconNames.filter(name => 
        name.toLowerCase().includes(searchLower)
      );
    } else if (showAll) {
      iconList = allIconNames;
    } else {
      iconList = POPULAR_ICONS.filter(name => allIconNames.includes(name));
    }

    return iconList;
  }, [search, showAll]);

  const SelectedIcon = value ? icons[value as keyof typeof icons] : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:border-white/20 transition-colors"
      >
        {SelectedIcon ? (
          <>
            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
              <SelectedIcon className="w-5 h-5" />
            </div>
            <span className="text-sm">{value}</span>
          </>
        ) : (
          <span className="text-gray-500 text-sm">아이콘 선택...</span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="아이콘 검색... (예: heart, star, user)"
                  className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                  autoFocus
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  {search ? `검색 결과: ${filteredIcons.length}개` : showAll ? `전체: ${allIconNames.length}개` : `인기 아이콘: ${filteredIcons.length}개`}
                </p>
                {!search && (
                  <button
                    type="button"
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    {showAll ? '인기 아이콘만' : '전체 보기'}
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              {filteredIcons.length > 0 ? (
                <div className="grid grid-cols-6 gap-1">
                  {filteredIcons.map((name) => {
                    const Icon = icons[name as keyof typeof icons];
                    if (!Icon) return null;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          onChange(name);
                          setIsOpen(false);
                          setSearch('');
                        }}
                        className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                          value === name
                            ? 'bg-primary text-black'
                            : 'hover:bg-white/10 text-white'
                        }`}
                        title={name}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 text-sm py-4">
                  아이콘을 찾을 수 없습니다
                </p>
              )}
            </div>

            {value && (
              <div className="p-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  아이콘 제거
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function DynamicIcon({ name, className }: { name: string; className?: string }) {
  if (!name) return null;
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) return null;
  return <Icon className={className} />;
}
