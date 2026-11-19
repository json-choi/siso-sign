'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { DailyPoint } from '@/lib/analytics';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function label(day: string): string {
  const [, month, date] = day.split('-').map(Number);
  return `${month}/${date}`;
}

function weekday(day: string): string {
  return WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
}

/** Rounds up to a tidy axis maximum (1, 2, 5 × 10^n). */
function niceMax(value: number): number {
  if (value <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * power >= value) ?? 10;
  return step * power;
}

/**
 * Daily visitors as bars. Hover or tap a day to read visitors and page views;
 * a table of the same numbers is available for screen readers.
 */
export default function VisitsChart({ data }: { data: DailyPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((point) => point.visitors), 0));
  const ticks = [max, max / 2, 0];
  const dense = data.length > 14;
  // Label every day for a week, otherwise every 7th (or 21st) day counted back from today.
  const step = data.length <= 7 ? 1 : data.length <= 31 ? 7 : 21;
  const shown = active ?? data.length - 1;
  const point = data[shown];

  return (
    <div>
      <div className="mb-3 flex min-h-10 items-end justify-between gap-3" aria-live="polite">
        <div>
          <p className="text-xs text-gray-500">
            {label(point.day)} ({weekday(point.day)}){active === null && ' · 오늘'}
          </p>
          <p className="text-sm text-gray-300">
            방문자 <span className="font-semibold tabular-nums text-white">{point.visitors.toLocaleString('ko-KR')}</span>
            <span className="mx-2 text-gray-600">·</span>
            페이지뷰 <span className="font-semibold tabular-nums text-white">{point.views.toLocaleString('ko-KR')}</span>
          </p>
        </div>
      </div>

      <div className="relative h-40 pl-8 sm:h-48" aria-hidden>
        {ticks.map((tick) => (
          <div key={tick} className="absolute inset-x-0 pl-8" style={{ bottom: `${(tick / max) * 100}%` }}>
            <span className="absolute left-0 -translate-y-1/2 text-[10px] tabular-nums text-gray-600">{tick}</span>
            <div className={cn('h-px', tick === 0 ? 'bg-white/15' : 'bg-white/[0.05]')} />
          </div>
        ))}
        <div className="relative flex h-full items-end gap-[2px]" onMouseLeave={() => setActive(null)}>
          {data.map((item, index) => (
            <button
              key={item.day}
              type="button"
              tabIndex={-1}
              onMouseEnter={() => setActive(index)}
              onClick={() => setActive(active === index ? null : index)}
              className="group flex h-full min-w-0 flex-1 items-end justify-center"
              aria-label={`${label(item.day)} 방문자 ${item.visitors}명`}
            >
              <span
                className={cn(
                  'w-full max-w-11 rounded-t-[4px] transition-colors',
                  item.visitors === 0 ? 'bg-white/[0.06]' : index === shown ? 'bg-[#e0336b]' : 'bg-[#e0336b]/55 group-hover:bg-[#e0336b]/80',
                )}
                style={{ height: item.visitors === 0 ? '2px' : `${Math.max((item.visitors / max) * 100, 2)}%` }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex gap-[2px] pl-8 text-[10px] text-gray-600" aria-hidden>
        {data.map((item, index) => {
          const visible = (data.length - 1 - index) % step === 0;
          return (
            <span key={item.day} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center">
              {visible ? (dense ? label(item.day) : <>{label(item.day)}<span className="hidden sm:inline"> {weekday(item.day)}</span></>) : ''}
            </span>
          );
        })}
      </div>

      <table className="sr-only">
        <caption>일별 방문자</caption>
        <thead><tr><th>날짜</th><th>방문자</th><th>페이지뷰</th></tr></thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.day}><td>{item.day}</td><td>{item.visitors}</td><td>{item.views}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
