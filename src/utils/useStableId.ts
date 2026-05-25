import * as React from 'react';
import { nanoid } from 'nanoid';

const reactUseId = (React as { useId?: () => string }).useId;

/**
 * Returns a string ID that is stable across re-renders and unique per call site.
 *
 * On React 18+ this delegates to `React.useId()` (colons stripped so the value is
 * safe to use anywhere an HTML id is expected). On React 17, where `useId` does
 * not exist, it falls back to a client-only id generated once on mount. The
 * fallback is intentionally not SSR-stable — React 17 has no primitive that
 * makes this possible, and consumers needing stable SSR ids on React 17 must
 * pass an explicit `id` prop.
 */
export const useStableId = (prefix = 'str-chat'): string => {
  if (reactUseId) return reactUseId().replace(/:/g, '');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [id] = React.useState(() => `${prefix}-${nanoid(8)}`);
  return id;
};
