import { useEffect, useRef, useState } from 'react';

import { useAriaLiveAnnouncer } from '../../Accessibility/useAriaLiveAnnouncer';
import { useStableCallback } from '../../../utils/useStableCallback';

type RetriedPaginator = { items: unknown[] | undefined };

export type UseFirstPageLoadRetryParams = {
  /** The error of the failed first page, while there is one (see `getFirstPageLoadError`). */
  firstPageLoadError: Error | undefined;
  /** Announced when a retry loads the first page. */
  loadedMessage: string;
  /** The paginator the retry loads the first page into. */
  paginator: RetriedPaginator;
  /** Queries the first page again. */
  reload: () => Promise<unknown>;
};

/**
 * Retries a paginated list's failed first page. While the retry runs, the failure it retries stays
 * the error to show, so the component showing it stays mounted and its focused retry button keeps
 * focus, also when the retry fails and its error replaces the old one. A retry that loads the first
 * page is announced.
 *
 * @returns `error`, the error to show (`undefined` once the first page loads), `isRetrying`, and
 *   `retry`, which starts a retry unless one is running or no first-page error is shown.
 */
export const useFirstPageLoadRetry = ({
  firstPageLoadError,
  loadedMessage,
  paginator,
  reload,
}: UseFirstPageLoadRetryParams) => {
  const announce = useAriaLiveAnnouncer();
  // The paginator is kept with the error, so a list given another paginator shows that one's state.
  const [retried, setRetried] = useState<{ error: Error; paginator: RetriedPaginator }>();
  const retriedError = retried?.paginator === paginator ? retried.error : undefined;
  // A second click before the busy state renders must not start a second retry of that paginator.
  const retryingPaginatorRef = useRef<RetriedPaginator>(undefined);
  // A retry that settles after the list unmounted updates and announces nothing, and one that
  // settles after the list moved to another paginator announces nothing either.
  const isMountedRef = useRef(false);
  const paginatorRef = useRef(paginator);
  paginatorRef.current = paginator;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const retry = useStableCallback(() => {
    if (retryingPaginatorRef.current === paginator || !firstPageLoadError) return;
    const retriedPaginator = paginator;
    retryingPaginatorRef.current = retriedPaginator;
    setRetried({ error: firstPageLoadError, paginator: retriedPaginator });
    // With `throwErrors` set, the reload rejects too; the error is in the paginator state either way.
    reload()
      .catch(() => undefined)
      .finally(() => {
        if (retryingPaginatorRef.current === retriedPaginator) {
          retryingPaginatorRef.current = undefined;
        }
        if (!isMountedRef.current) return;
        setRetried((current) =>
          current?.paginator === retriedPaginator ? undefined : current,
        );
        const showsRetriedPaginator = paginatorRef.current === retriedPaginator;
        if (showsRetriedPaginator && retriedPaginator.items !== undefined) {
          announce(loadedMessage);
        }
      });
  });

  return {
    error: retriedError ?? firstPageLoadError,
    isRetrying: !!retriedError,
    retry,
  };
};
