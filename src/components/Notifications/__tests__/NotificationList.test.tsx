import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { createDefaultPickNext, NotificationList, pickNewest } from '../NotificationList';
import { useNotificationApi } from '../hooks/useNotificationApi';
import { useNotifications } from '../hooks/useNotifications';
import { ComponentProvider } from '../../../context/ComponentContext';

import type { Notification } from 'stream-chat';

vi.mock('../hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
}));

vi.mock('../hooks/useNotificationApi', () => ({
  useNotificationApi: vi.fn(),
}));

vi.mock('../Notification', () => {
  const MockNotification = React.forwardRef(
    (
      {
        className,
        entryDirection,
        notification,
        onDismiss,
      }: {
        className?: string;
        entryDirection?: string;
        notification: { id: string; message: string };
        onDismiss?: () => void;
      },
      ref: React.Ref<HTMLDivElement>,
    ) => (
      <div
        className={className}
        data-entry-direction={entryDirection}
        data-testid={`notification-${notification.id}`}
        ref={ref}
      >
        <span>{notification.message}</span>
        <button onClick={onDismiss} type='button'>
          Dismiss
        </button>
      </div>
    ),
  );
  MockNotification.displayName = 'Notification';
  return { Notification: MockNotification };
});

const mockedUseNotificationApi = vi.mocked(useNotificationApi);
const mockedUseNotifications = vi.mocked(useNotifications);

const remove = vi.fn();
const startTimeout = vi.fn();

const EXIT_ANIMATION_MS = 340;
const DEFAULT_MIN_DISPLAY_MS = 1000;

type MockObserverEntry = {
  callback: IntersectionObserverCallback;
  element?: Element;
  options?: IntersectionObserverInit;
};

const observerEntries: MockObserverEntry[] = [];

class IntersectionObserverMock {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  element?: Element;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = callback;
    this.options = options;
    observerEntries.push({ callback, options });
  }

  disconnect = vi.fn();

  observe = (element: Element) => {
    this.element = element;
    observerEntries[observerEntries.length - 1].element = element;
  };

  unobserve = vi.fn();
}

const triggerLatestIntersection = () => {
  const last = observerEntries[observerEntries.length - 1];
  last?.callback(
    [{ isIntersecting: true } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
};

const transientFixture = (overrides: Partial<Notification> = {}): Notification =>
  ({
    createdAt: 1,
    duration: 3000,
    id: 'n-1',
    message: 'First',
    origin: { emitter: 'test' },
    severity: 'info',
    ...overrides,
  }) as Notification;

describe('NotificationList', () => {
  let currentNotifications: Notification[];

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    observerEntries.splice(0, observerEntries.length);
    currentNotifications = [];
    mockedUseNotificationApi.mockReturnValue({
      addNotification: vi.fn(),
      addSystemNotification: vi.fn(),
      removeNotification: remove,
      startNotificationTimeout: startTimeout,
    });
    remove.mockImplementation((id: string) => {
      currentNotifications = currentNotifications.filter(
        (notification) => notification.id !== id,
      );
    });
    mockedUseNotifications.mockImplementation(() => currentNotifications);
    window.IntersectionObserver = IntersectionObserverMock as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    remove.mockReset();
    startTimeout.mockReset();
    mockedUseNotificationApi.mockReset();
    mockedUseNotifications.mockReset();
    delete window['IntersectionObserver'];
  });

  it('starts a timeout only when the displayed notification first intersects', () => {
    currentNotifications = [transientFixture()];

    render(<NotificationList />);

    expect(startTimeout).not.toHaveBeenCalled();
    expect(observerEntries).toHaveLength(1);
    expect(screen.getByTestId('notification-list')).toHaveClass(
      'str-chat__notification-list--position-bottom',
    );
    expect(observerEntries[0].options?.root).toBe(
      screen.getByTestId('notification-list'),
    );

    triggerLatestIntersection();
    triggerLatestIntersection();

    expect(startTimeout).toHaveBeenCalledTimes(1);
    expect(startTimeout).toHaveBeenCalledWith('n-1');
  });

  it('starts timeouts immediately when IntersectionObserver is not available', () => {
    delete window['IntersectionObserver'];
    currentNotifications = [transientFixture()];

    render(<NotificationList />);

    expect(startTimeout).toHaveBeenCalledTimes(1);
    expect(startTimeout).toHaveBeenNthCalledWith(1, 'n-1');
  });

  it('shows the oldest queued notification first (FIFO) when multiple are already queued at mount', () => {
    currentNotifications = [
      transientFixture({ createdAt: 1, id: 'n-1', message: 'Old' }),
      transientFixture({ createdAt: 2, id: 'n-2', message: 'New' }),
    ];

    render(<NotificationList />);

    expect(screen.getByTestId('notification-n-1')).toBeInTheDocument();
    expect(screen.queryByTestId('notification-n-2')).not.toBeInTheDocument();
  });

  it('uses createDefaultPickNext to switch the default selector to LIFO', () => {
    currentNotifications = [
      transientFixture({ createdAt: 1, id: 'n-1', message: 'First' }),
      transientFixture({ createdAt: 2, id: 'n-2', message: 'Second' }),
      transientFixture({ createdAt: 3, id: 'n-3', message: 'Third' }),
    ];

    const pickNextLifo = createDefaultPickNext(pickNewest);
    const { rerender } = render(
      <NotificationList minDisplayMs={500} pickNext={pickNextLifo} />,
    );

    // With LIFO ordering the newest queued notification is shown first.
    expect(screen.getByTestId('notification-n-3')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender(<NotificationList minDisplayMs={500} pickNext={pickNextLifo} />);
    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });
    rerender(<NotificationList minDisplayMs={500} pickNext={pickNextLifo} />);

    // After dwell + exit, the next-newest replaces it.
    expect(remove).toHaveBeenCalledWith('n-3');
    expect(screen.getByTestId('notification-n-2')).toBeInTheDocument();
  });

  it('cycles through queued notifications in FIFO order after each dwell window', () => {
    currentNotifications = [
      transientFixture({ createdAt: 1, id: 'n-1', message: 'First' }),
      transientFixture({ createdAt: 2, id: 'n-2', message: 'Second' }),
      transientFixture({ createdAt: 3, id: 'n-3', message: 'Third' }),
    ];

    const { rerender } = render(<NotificationList minDisplayMs={500} />);
    expect(screen.getByTestId('notification-n-1')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender(<NotificationList minDisplayMs={500} />);
    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });
    rerender(<NotificationList minDisplayMs={500} />);
    expect(remove).toHaveBeenCalledWith('n-1');
    expect(screen.getByTestId('notification-n-2')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender(<NotificationList minDisplayMs={500} />);
    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });
    rerender(<NotificationList minDisplayMs={500} />);
    expect(remove).toHaveBeenCalledWith('n-2');
    expect(screen.getByTestId('notification-n-3')).toBeInTheDocument();
  });

  it('removes the displayed notification and shows the next one on dismiss', () => {
    currentNotifications = [
      transientFixture({ createdAt: 1, id: 'n-1', message: 'First' }),
      transientFixture({ createdAt: 2, id: 'n-2', message: 'Second' }),
    ];

    const { rerender } = render(<NotificationList />);

    expect(screen.getByTestId('notification-n-1')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss' })[0]);

    rerender(<NotificationList />);
    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });
    rerender(<NotificationList />);

    expect(remove).toHaveBeenCalledWith('n-1');
    expect(screen.getByTestId('notification-n-2')).toBeInTheDocument();
  });

  it('keeps the active snackbar for at least minDisplayMs before a queued one replaces it', () => {
    currentNotifications = [transientFixture({ createdAt: 1, id: 'n-1' })];

    const { rerender } = render(<NotificationList minDisplayMs={500} />);
    expect(screen.getByTestId('notification-n-1')).toBeInTheDocument();

    // Queue a second transient shortly after.
    act(() => {
      vi.advanceTimersByTime(100);
      currentNotifications = [
        ...currentNotifications,
        transientFixture({ createdAt: 200, id: 'n-2', message: 'Second' }),
      ];
    });
    rerender(<NotificationList minDisplayMs={500} />);

    // Mid-dwell: still showing the first one.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender(<NotificationList minDisplayMs={500} />);
    expect(screen.getByTestId('notification-n-1')).toBeInTheDocument();

    // After the dwell window the replacement begins exiting then entering.
    act(() => {
      vi.advanceTimersByTime(300);
    });
    rerender(<NotificationList minDisplayMs={500} />);

    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });
    rerender(<NotificationList minDisplayMs={500} />);

    expect(remove).toHaveBeenCalledWith('n-1');
    expect(screen.getByTestId('notification-n-2')).toBeInTheDocument();
  });

  it('replaces immediately when the new arrival lands after the dwell window', () => {
    currentNotifications = [transientFixture({ createdAt: 1, id: 'n-1' })];

    const { rerender } = render(<NotificationList minDisplayMs={500} />);

    act(() => {
      vi.advanceTimersByTime(600);
      currentNotifications = [
        ...currentNotifications,
        transientFixture({ createdAt: 700, id: 'n-2', message: 'Second' }),
      ];
    });
    rerender(<NotificationList minDisplayMs={500} />);

    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });
    rerender(<NotificationList minDisplayMs={500} />);

    expect(remove).toHaveBeenCalledWith('n-1');
    expect(screen.getByTestId('notification-n-2')).toBeInTheDocument();
  });

  it('immediately replaces the active snackbar when a same-type trigger repeats', () => {
    currentNotifications = [
      transientFixture({ createdAt: 1, id: 'n-1', type: 'poll:create:failed' }),
    ];

    const { rerender } = render(<NotificationList minDisplayMs={5000} />);
    expect(screen.getByTestId('notification-n-1')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(50);
      currentNotifications = [
        ...currentNotifications,
        transientFixture({
          createdAt: 60,
          id: 'n-2',
          message: 'Retry',
          type: 'poll:create:failed',
        }),
      ];
    });
    rerender(<NotificationList minDisplayMs={5000} />);

    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });
    rerender(<NotificationList minDisplayMs={5000} />);

    expect(remove).toHaveBeenCalledWith('n-1');
    expect(screen.getByTestId('notification-n-2')).toBeInTheDocument();
  });

  it('does not replace a persistent notification with a transient one', () => {
    currentNotifications = [
      transientFixture({
        createdAt: 1,
        duration: undefined,
        id: 'n-persistent',
        message: 'Persistent error',
      }),
    ];

    const { rerender } = render(<NotificationList minDisplayMs={100} />);
    expect(screen.getByTestId('notification-n-persistent')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(150);
      currentNotifications = [
        ...currentNotifications,
        transientFixture({ createdAt: 200, id: 'n-transient', message: 'Saved' }),
      ];
    });
    rerender(<NotificationList minDisplayMs={100} />);

    act(() => {
      vi.advanceTimersByTime(DEFAULT_MIN_DISPLAY_MS + EXIT_ANIMATION_MS);
    });
    rerender(<NotificationList minDisplayMs={100} />);

    expect(remove).not.toHaveBeenCalled();
    expect(screen.getByTestId('notification-n-persistent')).toBeInTheDocument();
    expect(screen.queryByTestId('notification-n-transient')).not.toBeInTheDocument();
  });

  it('replaces a persistent notification with a newer persistent one', () => {
    currentNotifications = [
      transientFixture({
        createdAt: 1,
        duration: undefined,
        id: 'n-old',
        message: 'Old persistent',
      }),
    ];

    const { rerender } = render(<NotificationList minDisplayMs={100} />);
    expect(screen.getByTestId('notification-n-old')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(150);
      currentNotifications = [
        ...currentNotifications,
        transientFixture({
          createdAt: 200,
          duration: undefined,
          id: 'n-new',
          message: 'New persistent',
        }),
      ];
    });
    rerender(<NotificationList minDisplayMs={100} />);

    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });
    rerender(<NotificationList minDisplayMs={100} />);

    expect(remove).toHaveBeenCalledWith('n-old');
    expect(screen.getByTestId('notification-n-new')).toBeInTheDocument();
  });

  it('unmounts the list after exit animation when the store becomes empty', () => {
    currentNotifications = [transientFixture({ id: 'n-1', message: 'Solo' })];

    const { rerender } = render(<NotificationList minDisplayMs={100} />);
    expect(screen.getByTestId('notification-n-1')).toBeInTheDocument();

    // Externally drain the store (simulates auto-dismiss or a `clear()` call).
    act(() => {
      currentNotifications = [];
    });
    rerender(<NotificationList minDisplayMs={100} />);

    // Mid exit animation: the notification is still mounted but flagged exiting.
    expect(screen.getByTestId('notification-n-1')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });
    rerender(<NotificationList minDisplayMs={100} />);

    expect(screen.queryByTestId('notification-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notification-n-1')).not.toBeInTheDocument();
  });

  it('mounts a freshly-added notification after the slot had been emptied', () => {
    currentNotifications = [transientFixture({ id: 'n-1', message: 'Solo' })];

    const { rerender } = render(<NotificationList minDisplayMs={100} />);

    act(() => {
      currentNotifications = [];
    });
    rerender(<NotificationList minDisplayMs={100} />);
    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });
    rerender(<NotificationList minDisplayMs={100} />);
    expect(screen.queryByTestId('notification-list')).not.toBeInTheDocument();

    act(() => {
      currentNotifications = [
        transientFixture({ createdAt: 100, id: 'n-2', message: 'Later' }),
      ];
    });
    rerender(<NotificationList minDisplayMs={100} />);

    expect(screen.getByTestId('notification-n-2')).toBeInTheDocument();
  });

  it('shows a queued transient once the persistent one is dismissed', () => {
    currentNotifications = [
      transientFixture({
        createdAt: 1,
        duration: undefined,
        id: 'n-persistent',
        message: 'Persistent',
      }),
      transientFixture({ createdAt: 2, id: 'n-transient', message: 'Saved' }),
    ];

    const { rerender } = render(<NotificationList minDisplayMs={100} />);
    expect(screen.getByTestId('notification-n-persistent')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss' })[0]);
    rerender(<NotificationList minDisplayMs={100} />);

    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });
    rerender(<NotificationList minDisplayMs={100} />);

    expect(remove).toHaveBeenCalledWith('n-persistent');
    expect(screen.getByTestId('notification-n-transient')).toBeInTheDocument();
  });

  it('supports bottom alignment', () => {
    currentNotifications = [transientFixture()];
    render(<NotificationList verticalAlignment='bottom' />);

    expect(screen.getByTestId('notification-list')).toHaveClass(
      'str-chat__notification-list--position-bottom',
    );
  });

  it('prefers per-notification entry direction over the list fallback', () => {
    currentNotifications = [transientFixture({ metadata: { entryDirection: 'left' } })];

    render(<NotificationList enterFrom='bottom' />);

    expect(screen.getByTestId('notification-list')).toHaveClass(
      'str-chat__notification-list--enter-from-left',
    );
    expect(screen.getByTestId('notification-n-1')).toHaveAttribute(
      'data-entry-direction',
      'left',
    );
  });

  it('uses origin.context.entryDirection when metadata is absent', () => {
    currentNotifications = [
      transientFixture({
        origin: {
          context: { entryDirection: 'right' },
          emitter: 'test',
        },
      }),
    ];

    render(<NotificationList enterFrom='bottom' />);

    expect(screen.getByTestId('notification-list')).toHaveClass(
      'str-chat__notification-list--enter-from-right',
    );
    expect(screen.getByTestId('notification-n-1')).toHaveAttribute(
      'data-entry-direction',
      'right',
    );
  });

  it('supports top vertical alignment', () => {
    currentNotifications = [transientFixture()];
    render(<NotificationList verticalAlignment='top' />);

    expect(screen.getByTestId('notification-list')).toHaveClass(
      'str-chat__notification-list--position-top',
    );
  });

  it('uses custom Notification component from ComponentContext', () => {
    currentNotifications = [transientFixture()];
    const CustomNotification = React.forwardRef<
      HTMLDivElement,
      {
        notification: { id: string; message: string };
      }
    >(({ notification }, ref) => (
      <div data-testid={`custom-notification-${notification.id}`} ref={ref}>
        {notification.message}
      </div>
    ));
    CustomNotification.displayName = 'CustomNotification';

    render(
      <ComponentProvider value={{ Notification: CustomNotification }}>
        <NotificationList />
      </ComponentProvider>,
    );

    expect(screen.getByTestId('custom-notification-n-1')).toBeInTheDocument();
  });
});
