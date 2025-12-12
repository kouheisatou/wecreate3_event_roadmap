'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HomeContent } from '@/app/page';

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  useEffect(() => {
    // クエリパラメータに変換してメインページにリダイレクト
    router.replace(`/?task=${taskId}`);
  }, [taskId, router]);

  return <HomeContent />;
}
