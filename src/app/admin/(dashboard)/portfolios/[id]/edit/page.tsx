'use client';

import { use, useCallback, useEffect, useState } from 'react';
import PortfolioForm from '@/components/admin/PortfolioForm';
import { ButtonLink, ErrorState, LoadingState } from '@/components/admin/ui';
import { adminRequest, errorMessage } from '@/lib/admin-api';
import type { Portfolio } from '@/types/database';

type PageProps = { params: Promise<{ id: string }> };

export default function EditPortfolioPage({ params }: PageProps) {
  const { id } = use(params);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPortfolio(await adminRequest<Portfolio>(`/api/admin/portfolios/${id}`));
    } catch (err) {
      setError(errorMessage(err, '프로젝트를 불러오지 못했습니다.'));
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <ErrorState message={error} onRetry={() => void load()} />
        <ButtonLink href="/admin/portfolios" variant="ghost" className="w-full">목록으로 돌아가기</ButtonLink>
      </div>
    );
  }
  if (!portfolio) return <LoadingState rows={3} />;
  return <PortfolioForm key={portfolio.id} portfolio={portfolio} />;
}
