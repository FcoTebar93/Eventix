'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';

export default function OrganizerPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/organizer/events');
  }, [router]);
  return null;
}
