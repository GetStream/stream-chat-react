import React from 'react';
import { render } from '@testing-library/react';

import { InfiniteScrollPaginator } from '../InfiniteScrollPaginator';

describe('InfiniteScrollPaginator', () => {
  it.each([true, false])(
    'stops preventing wheel events after unmount with useCapture as %s',
    (useCapture) => {
      const { container, unmount } = render(
        <InfiniteScrollPaginator useCapture={useCapture} />,
      );
      const root = container.firstElementChild as HTMLElement;

      const mountedWheelEvent = new WheelEvent('wheel', { cancelable: true, deltaY: 1 });
      root.dispatchEvent(mountedWheelEvent);
      expect(mountedWheelEvent.defaultPrevented).toBe(true);

      unmount();

      const wheelEvent = new WheelEvent('wheel', { cancelable: true, deltaY: 1 });
      root.dispatchEvent(wheelEvent);
      expect(wheelEvent.defaultPrevented).toBe(false);
    },
  );
});
