'use client';

import { use } from 'react';
import PortfolioForm from '@/components/admin/PortfolioForm';
import { toProjectType } from '@/lib/project-types';

type PageProps = { searchParams: Promise<{ type?: string }> };

export default function NewPortfolioPage({ searchParams }: PageProps) {
  const { type } = use(searchParams);
  return <PortfolioForm portfolio={null} defaultType={toProjectType(type)} />;
}
