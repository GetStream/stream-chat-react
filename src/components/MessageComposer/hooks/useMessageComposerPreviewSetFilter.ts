import { useMemo } from 'react';

import { useMessageComposerPreviewState } from './useMessageComposerPreviewState';
import type { MessageComposerPreviewSetItem } from '../MessageComposerPreviews';

/**
 * Keeps the previews whose `isVisible` holds for the current composer state.
 *
 * @param messageComposerPreviewSet - Previews to filter, in render order.
 * @returns The previews to render, in the same order. Empty when none is visible.
 */
export const useMessageComposerPreviewSetFilter = (
  messageComposerPreviewSet: MessageComposerPreviewSetItem[],
) => {
  const previewState = useMessageComposerPreviewState();

  return useMemo(
    () => messageComposerPreviewSet.filter((item) => item.isVisible(previewState)),
    [messageComposerPreviewSet, previewState],
  );
};
