import { useMemo } from 'react';

type AriaIdentifierDescriptor = 'description' | 'title';

const sanitizeAriaRootId = (rootId?: string) =>
  rootId?.trim().replace(/[^A-Za-z0-9:_-]/g, '-') ?? '';

const buildAriaIdentifier = (
  sanitizedRootId: string,
  descriptor: AriaIdentifierDescriptor,
) => (sanitizedRootId ? `${sanitizedRootId}-${descriptor}` : undefined);

/**
 * Derives stable ARIA identifier IDs from a single root ID.
 *
 * Use this to keep dialog/component labeling conventions consistent without
 * manually building `*-title` and `*-description` IDs at each call site.
 *
 * Behavior:
 * - Root ID is trimmed and sanitized to `[A-Za-z0-9:_-]` before use.
 * - Returns `undefined` IDs when root ID is missing/empty after sanitization.
 */
export const useAriaIdentifiers = (rootId?: string) => {
  const sanitizedRootId = sanitizeAriaRootId(rootId);

  return useMemo(
    () => ({
      descriptionId: buildAriaIdentifier(sanitizedRootId, 'description'),
      titleId: buildAriaIdentifier(sanitizedRootId, 'title'),
    }),
    [sanitizedRootId],
  );
};
