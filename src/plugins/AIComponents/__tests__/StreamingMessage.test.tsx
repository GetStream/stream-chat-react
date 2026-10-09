import React, { createRef } from 'react';
import { act, render } from '@testing-library/react';

import { StreamingMessage, type StreamingMessageRef } from '..';

describe('StreamingMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('types appended text and skipAnimation flushes it', () => {
    const ref = createRef<StreamingMessageRef>();
    const { container, rerender } = render(<StreamingMessage ref={ref} text='Hello' />);
    expect(container.textContent).toBe('Hello');

    rerender(<StreamingMessage ref={ref} text='Hello world' />);
    act(() => {
      vi.advanceTimersByTime(30);
    });
    expect(container.textContent).toBe('Hello w');

    act(() => ref.current?.skipAnimation());
    expect(container.textContent).toBe('Hello world');
  });

  it('honours letterIntervalMs', () => {
    const { container, rerender } = render(
      <StreamingMessage letterIntervalMs={100} text='' />,
    );
    rerender(<StreamingMessage letterIntervalMs={100} text='abcd' />);
    act(() => {
      vi.advanceTimersByTime(99);
    });
    expect(container.textContent).toBe('');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(container.textContent).toBe('ab');
  });
});
