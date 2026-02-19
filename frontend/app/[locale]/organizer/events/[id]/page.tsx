'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';

export default function OrganizerEventIdPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/organizer/events/${id}/edit`);
    }
  }, [id, router]);

  return null;
}
