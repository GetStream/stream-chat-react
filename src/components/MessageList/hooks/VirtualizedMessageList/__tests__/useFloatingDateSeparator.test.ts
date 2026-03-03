import { act, renderHook } from '@testing-library/react';

import { useFloatingDateSeparator } from '../useFloatingDateSeparator';
import type { RenderedMessage } from '../../../utils';
import { CUSTOM_MESSAGE_TYPE } from '../../../../../constants/messageTypes';

const makeDateSeparator = (date: Date): RenderedMessage =>
  ({
    customType: CUSTOM_MESSAGE_TYPE.date,
    date,
    id: `date-${date.toISOString()}`,
    type: 'date',
    unread: false,
  }) as unknown as RenderedMessage;

const makeMessage = (id: string, createdAt: Date): RenderedMessage =>
  ({
    created_at: createdAt,
    id,
    type: 'regular',
    user: { id: 'user' },
  }) as unknown as RenderedMessage;

describe('useFloatingDateSeparator', () => {
  const jan1 = new Date('2025-01-01T12:00:00Z');
  const jan2 = new Date('2025-01-02T12:00:00Z');
  const processedMessages: RenderedMessage[] = [
    makeDateSeparator(jan1),
    makeMessage('m1', jan1),
    makeMessage('m2', jan1),
    makeDateSeparator(jan2),
    makeMessage('m3', jan2),
  ];

  it('returns visible false when date separators are disabled', () => {
    const { result } = renderHook(() =>
      useFloatingDateSeparator({
        disableDateSeparator: true,
        processedMessages,
      }),
    );

    act(() => {
      result.current.onItemsRendered([makeMessage('m2', jan1)]);
    });

    expect(result.current.showFloatingDate).toBe(false);
    expect(result.current.floatingDate).toBeNull();
  });

  it('hides floating when first visible item is a date separator', () => {
    const { result } = renderHook(() =>
      useFloatingDateSeparator({
        disableDateSeparator: false,
        processedMessages,
      }),
    );

    act(() => {
      result.current.onItemsRendered([makeDateSeparator(jan1), makeMessage('m1', jan1)]);
    });

    expect(result.current.showFloatingDate).toBe(false);
    expect(result.current.floatingDate).toBeNull();
  });

  it('shows floating with correct date when first visible is a message', () => {
    const { result } = renderHook(() =>
      useFloatingDateSeparator({
        disableDateSeparator: false,
        processedMessages,
      }),
    );

    act(() => {
      result.current.onItemsRendered([makeMessage('m2', jan1), makeMessage('m3', jan2)]);
    });

    expect(result.current.showFloatingDate).toBe(true);
    expect(result.current.floatingDate).toEqual(jan1);
  });

  it('hides when any date separator is in visible set', () => {
    const { result } = renderHook(() =>
      useFloatingDateSeparator({
        disableDateSeparator: false,
        processedMessages,
      }),
    );

    act(() => {
      result.current.onItemsRendered([
        makeMessage('m2', jan1),
        makeDateSeparator(jan2),
        makeMessage('m3', jan2),
      ]);
    });

    expect(result.current.showFloatingDate).toBe(false);
  });
});
