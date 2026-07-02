import { useCallback, useState } from 'react';

export type UseFrequentlyUsedEmojiParams = {
  /** Controlled ordered list of recently used emoji ids (most recent first). */
  frequentlyUsedEmoji?: string[];
  /** Called with the updated ordered list whenever an emoji is used. */
  onFrequentlyUsedChange?: (emojiIds: string[]) => void;
};

const MAX_FREQUENTLY_USED = 24;

/**
 * Tracks recently used emoji as an ordered, most-recent-first list. Controlled via
 * `frequentlyUsedEmoji`/`onFrequentlyUsedChange`; otherwise kept ephemerally in
 * memory for the current mount (reset on reload). The SDK never persists — see the
 * vite example for a localStorage-backed integrator pattern.
 */
export const useFrequentlyUsedEmoji = ({
  frequentlyUsedEmoji,
  onFrequentlyUsedChange,
}: UseFrequentlyUsedEmojiParams) => {
  const [internal, setInternal] = useState<string[]>([]);
  const isControlled = Array.isArray(frequentlyUsedEmoji);
  const frequentlyUsedIds = isControlled ? frequentlyUsedEmoji : internal;

  const recordUse = useCallback(
    (emojiId: string) => {
      const next = [
        emojiId,
        ...frequentlyUsedIds.filter((existing) => existing !== emojiId),
      ].slice(0, MAX_FREQUENTLY_USED);
      if (!isControlled) setInternal(next);
      onFrequentlyUsedChange?.(next);
    },
    [frequentlyUsedIds, isControlled, onFrequentlyUsedChange],
  );

  return { frequentlyUsedIds, recordUse };
};
