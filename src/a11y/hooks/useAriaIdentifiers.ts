import { useMemo } from 'react';

type AriaIdentifierDescriptor = 'description' | 'title';

const sanitizeAriaRootId = (rootId?: string) =>
  rootId?.trim().replace(/[^A-Za-z0-9:_-]/g, '-') ?? '';

const buildAriaIdentifier = (
  sanitizedRootId: string,
  descriptor: AriaIdentifierDescriptor,
) => (sanitizedRootId ? `${sanitizedRootId}-${descriptor}` : undefined);

/**
 * Derives `titleId` and `descriptionId` (`<rootId>-title`, `<rootId>-description`) from a root ID.
 * The root ID is trimmed and characters outside `[A-Za-z0-9:_-]` become `-`; both IDs are
 * `undefined` when no root ID is left.
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
