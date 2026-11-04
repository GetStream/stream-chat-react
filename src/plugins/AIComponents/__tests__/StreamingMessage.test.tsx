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

  it('shows text there from the start at once', () => {
    const { container } = render(<StreamingMessage text='A reply loaded from history' />);
    expect(container.textContent).toBe('A reply loaded from history');
  });

  it('types a trickle of appended text a letter a frame', () => {
    const { container, rerender } = render(<StreamingMessage text='Hello' />);
    rerender(<StreamingMessage text='Hello world' />);
    act(() => {
      vi.advanceTimersByTime(16 * 2);
    });
    expect(container.textContent).toBe('Hello w');
    act(() => {
      vi.advanceTimersByTime(16 * 4);
    });
    expect(container.textContent).toBe('Hello world');
  });

  it('writes a long chunk in about 400ms, however long it is', () => {
    const chunk = 'word '.repeat(300);
    const { container, rerender } = render(<StreamingMessage text='' />);
    rerender(<StreamingMessage text={chunk} />);
    act(() => {
      vi.advanceTimersByTime(16);
    });
    // The first frame writes a share of the backlog, far more than the old fixed two letters.
    expect(container.textContent!.length).toBeGreaterThan(30);
    expect(container.textContent!.length).toBeLessThan(chunk.length);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(container.textContent).toBe(chunk.trimEnd());
  });

  it('skipAnimation writes the rest at once', () => {
    const ref = createRef<StreamingMessageRef>();
    const { container, rerender } = render(<StreamingMessage ref={ref} text='Hello' />);
    rerender(<StreamingMessage ref={ref} text={'Hello world, '.repeat(40)} />);
    act(() => ref.current?.skipAnimation());
    expect(container.textContent).toBe('Hello world, '.repeat(40).trimEnd());
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
