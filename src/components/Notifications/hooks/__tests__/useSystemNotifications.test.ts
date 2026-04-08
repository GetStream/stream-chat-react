import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { useChatContext } from '../../../../context';
import { useStateStore } from '../../../../store';
import { useSystemNotifications } from '../useSystemNotifications';

import type { Notification } from 'stream-chat';

vi.mock('../../../../context', () => ({
  useChatContext: vi.fn(),
}));

vi.mock('../../../../store', () => ({
  useStateStore: vi.fn(),
}));

const mockedUseChatContext = vi.mocked(useChatContext);
const mockedUseStateStore = vi.mocked(useStateStore);

const baseNotification = (overrides: Partial<Notification>): Notification =>
  fromPartial<Notification>({
    createdAt: 1,
    id: 'n1',
    message: 'msg',
    origin: { emitter: 't' },
    ...overrides,
  });

describe('useSystemNotifications', () => {
  beforeEach(() => {
    mockedUseChatContext.mockReturnValue(
      fromPartial({
        client: {
          notifications: { store: {} },
        },
      }),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns only notifications with the system tag', () => {
    const sys = baseNotification({ id: 'sys', tags: ['system'] });
    const other = baseNotification({ id: 'other', tags: ['target:channel'] });

    mockedUseStateStore.mockImplementation((_store, selector) =>
      selector(fromPartial({ notifications: [sys, other] })),
    );

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current).toEqual([sys]);
  });

  it('applies optional filter after system tag', () => {
    const a = baseNotification({ id: 'a', severity: 'error', tags: ['system'] });
    const b = baseNotification({ id: 'b', severity: 'info', tags: ['system'] });

    mockedUseStateStore.mockImplementation((_store, selector) =>
      selector(fromPartial({ notifications: [a, b] })),
    );

    const { result } = renderHook(() =>
      useSystemNotifications({
        filter: (n) => n.severity === 'error',
      }),
    );

    expect(result.current).toEqual([a]);
  });
});
