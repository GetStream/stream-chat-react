import { useCallback, useEffect, useState } from 'react';
import { type EmojiData, loadEmojiData } from '../data';

/**
 * Loads the vendored emoji dataset lazily (via the code-split dynamic import) and
 * exposes it once resolved.
 *
 * `data` is `null` while loading. If the load fails (offline, or a stale chunk after a
 * deploy) `error` becomes `true`; `retry()` re-attempts it. Because `loadEmojiData`
 * drops its memo on failure, the retry actually re-imports rather than replaying the
 * rejected promise — so the picker can recover without a full page reload.
 */
export const useEmojiPickerState = () => {
  const [data, setData] = useState<EmojiData | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(false);
    loadEmojiData()
      .then((loaded) => {
        if (active) setData(loaded);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  return { data, error, retry };
};
