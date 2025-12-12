'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HomeContent } from '@/app/page';

export default function SubtaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const subtaskId = params.subtaskId as string;

  useEffect(() => {
    // クエリパラメータに変換してメインページにリダイレクト
    router.replace(`/?task=${taskId}&subtask=${subtaskId}`);
  }, [taskId, subtaskId, router]);

  return <HomeContent />;
}
