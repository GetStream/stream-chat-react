'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserId } from './rateLimitUtils';

/**
 * Client component that handles user initialization and URL synchronization
 */
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlUserId = searchParams.get('user_id');
    const currentUserId = getUserId();

    // If no user_id in URL, add it
    if (!urlUserId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('user_id', currentUserId);
      router.replace(`?${params.toString()}`);
    }

    setIsInitialized(true);
  }, [router, searchParams]);

  if (!isInitialized) {
    return <>Loading...</>;
  }

  return <>{children}</>;
};
