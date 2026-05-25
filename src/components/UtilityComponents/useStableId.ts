import { nanoid } from 'nanoid';
import React, { useMemo } from 'react';

const reactUseId = React.useId as (() => string) | undefined;

/**
 * Returns a stable, unique string id.
 *
 * On React 18+ this delegates to `React.useId()` (with the surrounding colons stripped
 * so the value is safe to use anywhere an HTML id is expected) and is SSR-stable.
 * On React 17, it falls back to a client-only id generated via `nanoid`.
 */
export const useStableId = () => {
  if (reactUseId) return reactUseId().replace(/:/g, '');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMemo(() => nanoid(), []);
};
