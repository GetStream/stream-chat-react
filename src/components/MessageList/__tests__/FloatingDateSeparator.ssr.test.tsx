// @vitest-environment node
import React, { createRef } from 'react';
import { renderToString } from 'react-dom/server';

import { FloatingDateSeparator } from '../FloatingDateSeparator';
import type { RenderedMessage } from '../utils';

it('server-renders in both list modes without touching browser globals', () => {
  expect(typeof window).toBe('undefined');
  const processedMessages = [{ id: 'm1', type: 'regular' } as unknown as RenderedMessage];

  expect(() =>
    renderToString(
      <>
        <FloatingDateSeparator
          listElement={null}
          processedMessages={processedMessages}
          withDateSeparator
        />
        <FloatingDateSeparator
          itemsRenderedRef={createRef()}
          processedMessages={processedMessages}
          scrollElement={null}
          withDateSeparator
        />
      </>,
    ),
  ).not.toThrow();
});
