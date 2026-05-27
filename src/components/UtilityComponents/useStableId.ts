import { nanoid } from 'nanoid';
import React, { useMemo } from 'react';

const reactUseId = React.useId as (() => string) | undefined;

// Strips React.useId() wrapper characters so the value is safe as an HTML id:
// from React 19.0 (`:r0:` -> `r0`) and 19.1 (`«r0»` -> `r0`);
// 19.2+ uses `_r_1_` which is safe and doesn't need stripping
export const stripUseIdWrappers = (id: string): string => id.replace(/[:«»]/g, '');

/**
 * Returns a stable, unique string id.
 *
 * On React 18+ this delegates to `React.useId()` (with the surrounding wrapper
 * characters stripped so the value is safe to use anywhere an HTML id is expected)
 * and is SSR-stable. On React 17, it falls back to a client-only id generated via `nanoid`.
 */
export const useStableId = () => {
  if (reactUseId) return stripUseIdWrappers(reactUseId());
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMemo(() => nanoid(), []);
};
