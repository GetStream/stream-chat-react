import { type RefObject, useEffect, useRef } from 'react';

// How long the spinner above the turns stays in view before older messages load, so a list
// that opens at its end does not load for the frame its start shows.
const LOAD_OLDER_DELAY_MS = 300;
// How long to wait before asking again after loading older messages failed.
const LOAD_OLDER_RETRY_MS = 3000;

export type UseOlderPageLoaderParams = {
  firstTurnId: string | undefined;
  loadOlderMessages: (() => Promise<unknown> | void) | undefined;
  /** Whether the spinner shows. */
  loadsOlder: boolean;
  scrollerRef: RefObject<HTMLElement | null>;
};

/**
 * Loads older messages once the spinner above the turns has been in view a moment, and again
 * whenever the first turn changes while it is in view; after a pause when a load failed. Returns
 * the ref for the spinner.
 */
export const useOlderPageLoader = ({
  firstTurnId,
  loadOlderMessages,
  loadsOlder,
  scrollerRef,
}: UseOlderPageLoaderParams) => {
  const loadOlderRef = useRef(loadOlderMessages);
  loadOlderRef.current = loadOlderMessages;
  const spinnerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const spinner = spinnerRef.current;
    const scroller = scrollerRef.current;
    if (
      !loadsOlder ||
      !spinner ||
      !scroller ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let loading = false;
    let disposed = false;
    const observer = new IntersectionObserver(
      ([visible]) => {
        clearTimeout(timer);
        if (!visible?.isIntersecting || loading) return;
        timer = setTimeout(() => {
          loading = true;
          let failed = false;
          Promise.resolve(loadOlderRef.current?.())
            .catch(() => {
              failed = true;
            })
            .finally(() => {
              loading = false;
              if (disposed) return;
              // Watching the spinner afresh reports whether it is still in view, so a load that
              // failed, or brought nothing while there is more, asks again: after a pause when
              // it failed. A load that brought older messages re-runs this effect instead.
              observer.unobserve(spinner);
              timer = setTimeout(
                () => observer.observe(spinner),
                failed ? LOAD_OLDER_RETRY_MS : 0,
              );
            });
        }, LOAD_OLDER_DELAY_MS);
      },
      { root: scroller },
    );
    observer.observe(spinner);
    return () => {
      disposed = true;
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [firstTurnId, loadsOlder, scrollerRef]);

  return spinnerRef;
};
