import { useCallback, useState } from 'react';
import { MAX_SKIN_TONE_INDEX } from '../components/skinTones';

export type UseSkinToneParams = {
  /** Uncontrolled initial skin tone index (0 = default, 1–5 = light → dark). */
  defaultSkinTone?: number;
  /** Called with the new skin tone index whenever it changes. */
  onSkinToneChange?: (skinTone: number) => void;
  /** Controlled skin tone index. When provided, the picker does not hold its own. */
  skinTone?: number;
};

const clamp = (value: number) =>
  Math.min(MAX_SKIN_TONE_INDEX, Math.max(0, Math.floor(value)));

/**
 * Controlled-or-uncontrolled skin tone selection. The SDK never persists the value
 * — integrators own persistence by controlling `skinTone`/`onSkinToneChange`.
 */
export const useSkinTone = ({
  defaultSkinTone,
  onSkinToneChange,
  skinTone,
}: UseSkinToneParams) => {
  const [internal, setInternal] = useState(() => clamp(defaultSkinTone ?? 0));
  const isControlled = typeof skinTone === 'number';
  const value = clamp(isControlled ? skinTone : internal);

  const setSkinTone = useCallback(
    (next: number) => {
      const clamped = clamp(next);
      if (!isControlled) setInternal(clamped);
      onSkinToneChange?.(clamped);
    },
    [isControlled, onSkinToneChange],
  );

  return [value, setSkinTone] as const;
};
