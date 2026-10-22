import { nanoid } from 'nanoid';
import React, { useMemo } from 'react';

const reactUseId = React.useId as (() => string) | undefined;

/**
 * Strips the `useId` wrapper characters so the value is a safe HTML ID: `:r0:` (React 19.0) and
 * `«r0»` (19.1) become `r0`. React 19.2+ (`_r_1_`) needs no stripping.
 */
export const stripUseIdWrappers = (id: string): string => id.replace(/[:«»]/g, '');

/**
 * Returns a stable, unique string ID: `React.useId()` with its wrapper characters stripped
 * (SSR-stable) where it exists, a client-only `nanoid` on React 17.
 */
export const useStableId = () => {
  if (reactUseId) return stripUseIdWrappers(reactUseId());
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMemo(() => nanoid(), []);
};
