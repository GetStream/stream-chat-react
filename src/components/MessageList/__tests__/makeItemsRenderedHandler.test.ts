import type { ListItem } from 'react-virtuoso';

import { makeItemsRenderedHandler } from '../VirtualizedMessageListComponents';
import type { RenderedMessage } from '../utils';
import type { UnknownType } from '../../../types/types';

vi.mock('lodash.throttle', () => ({
  default: (fn: (...args: unknown[]) => unknown) => fn,
}));

const messages = ['a', 'b', 'c'].map((id) => ({ id }) as RenderedMessage);

// Virtuoso reports each rendered item's position in the data as `originalIndex` (0-based), apart
// from the absolute `index` that includes `firstItemIndex`.
const item = (originalIndex: number): ListItem<UnknownType> =>
  ({
    index: 10 ** 7 + originalIndex,
    offset: 0,
    originalIndex,
    size: 30,
  }) as ListItem<UnknownType>;

describe('makeItemsRenderedHandler', () => {
  it('passes the rendered messages, the first loaded one included', () => {
    const action = vi.fn();
    makeItemsRenderedHandler([action], messages)([item(0), item(1)]);
    expect(action).toHaveBeenCalledWith([messages[0], messages[1]]);
  });

  it('skips items Virtuoso reports without a data position', () => {
    const action = vi.fn();
    makeItemsRenderedHandler(
      [action],
      messages,
    )([{ index: 0, offset: 0, size: 30 } as ListItem<UnknownType>, item(2)]);
    expect(action).toHaveBeenCalledWith([messages[2]]);
  });
});
