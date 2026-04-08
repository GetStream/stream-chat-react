import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { NotificationList } from '../NotificationList';
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

const notifications = [
  {
    createdAt: 1,
    duration: 1000,
    id: 'n-1',
    message: 'First',
    origin: { emitter: 'test' },
    severity: 'info',
  },
  {
    createdAt: 2,
    id: 'n-2',
    message: 'Second',
    origin: { emitter: 'test' },
    severity: 'info',
  },
] as Notification[];

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

describe('NotificationList', () => {
  let currentNotifications: Notification[];

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    observerEntries.splice(0, observerEntries.length);
    currentNotifications = [...notifications];
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

  it('starts a timeout only when a notification first intersects the scroll container', () => {
    render(<NotificationList />);

    expect(startTimeout).not.toHaveBeenCalled();
    expect(observerEntries).toHaveLength(1);
    expect(screen.getByTestId('notification-list')).toHaveClass(
      'str-chat__notification-list--position-bottom',
    );

    const listElement = screen.getByTestId('notification-list');
    expect(observerEntries[0].options?.root).toBe(listElement);

    observerEntries[0].callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    observerEntries[0].callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(startTimeout).toHaveBeenCalledTimes(1);
    expect(startTimeout).toHaveBeenCalledWith('n-1');
  });

  it('starts timeouts immediately when IntersectionObserver is not available', () => {
    delete window['IntersectionObserver'];

    render(<NotificationList />);

    expect(startTimeout).toHaveBeenCalledTimes(1);
    expect(startTimeout).toHaveBeenNthCalledWith(1, 'n-1');
  });

  it('clears timeout and removes notification on dismiss', () => {
    const { rerender } = render(<NotificationList />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss' })[0]);

    expect(screen.getByTestId('notification-n-1')).toBeInTheDocument();
    expect(screen.queryByTestId('notification-n-2')).not.toBeInTheDocument();

    rerender(<NotificationList />);
    act(() => {
      vi.advanceTimersByTime(340);
    });
    rerender(<NotificationList />);

    expect(remove).toHaveBeenCalledWith('n-1');
    expect(screen.getByTestId('notification-n-2')).toBeInTheDocument();
  });

  it('supports bottom alignment', () => {
    render(<NotificationList verticalAlignment='bottom' />);

    expect(screen.getByTestId('notification-list')).toHaveClass(
      'str-chat__notification-list--position-bottom',
    );
  });

  it('prefers per-notification entry direction over the list fallback', () => {
    currentNotifications = [
      {
        ...notifications[0],
        metadata: { entryDirection: 'left' },
      },
    ];

    render(<NotificationList enterFrom='bottom' />);

    expect(screen.getByTestId('notification-list')).toHaveClass(
      'str-chat__notification-list--enter-from-left',
    );
    expect(screen.getByTestId('notification-n-1')).toHaveAttribute(
      'data-entry-direction',
      'left',
    );
  });

  it('uses custom Notification component from ComponentContext', () => {
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
