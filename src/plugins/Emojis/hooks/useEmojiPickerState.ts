import { useEffect, useState } from 'react';
import { type EmojiData, loadEmojiData } from '../data';

/**
 * Loads the vendored emoji dataset lazily (via the code-split dynamic import) and
 * exposes it once resolved. Returns `null` while loading.
 */
export const useEmojiPickerState = () => {
  const [data, setData] = useState<EmojiData | null>(null);

  useEffect(() => {
    let active = true;
    loadEmojiData()
      .then((loaded) => {
        if (active) setData(loaded);
      })
      .catch(() => {
        // Swallow — the picker stays in its loading state if data fails to load.
      });
    return () => {
      active = false;
    };
  }, []);

  return { data };
};
