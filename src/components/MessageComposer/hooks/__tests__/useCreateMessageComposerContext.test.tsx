import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { MessageComposerContextValue } from '../../../../context/MessageComposerContext';
import { useCreateMessageComposerContext } from '../useCreateMessageComposerContext';

const baseValue = fromPartial<MessageComposerContextValue>({
  textareaRef: { current: null },
});

describe('useCreateMessageComposerContext', () => {
  it.each(['minRows', 'maxRows'] as const)('passes on a changed %s', (key) => {
    const { rerender, result } = renderHook(
      (rows: number) => useCreateMessageComposerContext({ ...baseValue, [key]: rows }),
      { initialProps: 3 },
    );

    rerender(5);

    expect(result.current[key]).toBe(5);
  });
});
