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
        processedMessages,
        withDateSeparator: false,
      }),
    );

    act(() => {
      result.current.onItemsRendered([makeMessage('m2', jan1)]);
    });

    expect(result.current.firstRenderedItemDate).toBeNull();
  });

  it('takes the own date of an inline date separator rendered first and flags it', () => {
    const { result } = renderHook(() =>
      useFloatingDateSeparator({
        processedMessages,
        withDateSeparator: true,
      }),
    );

    act(() => {
      result.current.onItemsRendered([makeDateSeparator(jan2), makeMessage('m3', jan2)]);
    });

    expect(result.current.firstRenderedItemDate).toEqual(jan2);
    expect(result.current.isFirstRenderedItemDateSeparator).toBe(true);
  });

  it('clears the flag once a message is rendered first', () => {
    const { result } = renderHook(() =>
      useFloatingDateSeparator({
        processedMessages,
        withDateSeparator: true,
      }),
    );

    act(() => {
      result.current.onItemsRendered([makeDateSeparator(jan1), makeMessage('m1', jan1)]);
    });
    expect(result.current.isFirstRenderedItemDateSeparator).toBe(true);

    act(() => {
      result.current.onItemsRendered([makeMessage('m1', jan1), makeMessage('m2', jan1)]);
    });
    expect(result.current.isFirstRenderedItemDateSeparator).toBe(false);
    expect(result.current.firstRenderedItemDate).toEqual(jan1);
  });

  it('takes the date of the separator above a message rendered first', () => {
    const { result } = renderHook(() =>
      useFloatingDateSeparator({
        processedMessages,
        withDateSeparator: true,
      }),
    );

    act(() => {
      result.current.onItemsRendered([makeMessage('m2', jan1), makeMessage('m3', jan2)]);
    });

    expect(result.current.firstRenderedItemDate).toEqual(jan1);
  });

  it('keeps top group date when a later date separator is also visible', () => {
    const { result } = renderHook(() =>
      useFloatingDateSeparator({
        processedMessages,
        withDateSeparator: true,
      }),
    );

    act(() => {
      result.current.onItemsRendered([
        makeMessage('m2', jan1),
        makeDateSeparator(jan2),
        makeMessage('m3', jan2),
      ]);
    });

    expect(result.current.firstRenderedItemDate).toEqual(jan1);
  });
});
