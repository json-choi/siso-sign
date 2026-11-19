'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button, inputClass } from '@/components/admin/ui';
import { safeAdminRedirect } from '@/lib/admin-redirect';
import { cn } from '@/lib/cn';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [show, setShow] = useState(false);
  const searchParams = useSearchParams();
  const redirect = safeAdminRedirect(searchParams.get('redirect'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data: { error?: string } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || '로그인에 실패했습니다.');
        setIsLoading(false);
        return;
      }

      // A full page load makes the next request carry the new session cookie,
      // rather than racing a client-side navigation against it. The button
      // stays in its loading state until the new page replaces this one.
      window.location.replace(redirect);
    } catch {
      setError('서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white shadow-lg shadow-primary/30">
          S
        </div>
        <h1 className="text-2xl font-bold text-white">siso-sign 관리자</h1>
        <p className="mt-2 text-sm text-gray-400">관리자 비밀번호를 입력하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-[#121212] p-5 sm:p-6">
        <div className="relative">
          <label htmlFor="admin-password" className="sr-only">비밀번호</label>
          <input
            id="admin-password"
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            autoComplete="current-password"
            className={cn(inputClass, 'h-12 pr-12')}
            autoFocus
            aria-invalid={Boolean(error)}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 hover:text-white"
            aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}

        <Button type="submit" variant="primary" className="h-12 w-full" loading={isLoading} disabled={!password}>
          {isLoading ? '로그인 중…' : '로그인'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/" className="transition-colors hover:text-white">
          ← 사이트로 돌아가기
        </Link>
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-dvh bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,rgba(164,0,53,0.18),transparent_60%)] flex items-center justify-center px-4 py-10">
      <Suspense fallback={
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
            <Lock className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
