import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  type RenderResult,
  screen,
  waitFor,
} from '@testing-library/react';
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { initClientWithChannels } from '../../../mock-builders';
import { ShareLocationDialog } from '../ShareLocationDialog';
import type {
  ShareGeolocationMapProps,
  ShareLocationDialogProps,
} from '../ShareLocationDialog';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

vi.mock('../../MessageComposer/hooks/useMessageComposerController', () => ({
  useMessageComposerController: vi.fn().mockReturnValue({
    locationComposer: {
      initState: vi.fn(),
      setData: vi.fn(),
    },
    sendLocation: vi.fn(),
  }),
}));

vi.mock('../../Notifications', async (importOriginal) => ({
  ...((await importOriginal()) as object),
  useNotificationApi: vi
    .fn()
    .mockReturnValue({ addNotification: vi.fn(), addSystemNotification: vi.fn() }),
  useNotificationTarget: vi.fn().mockReturnValue('channel'),
}));

const DROPDOWN_SELECTOR = '.str-chat__live-location-sharing-duration-selector__button';
const SHARE_LIVE_LOCATION_SWITCH_TEST_ID = 'share-location-dialog-live-location-switch';
const GEOLOCATION_MAP_TEST_ID = 'geolocation-map';

const close = vi.fn().mockImplementation(() => {});
const user = { id: 'user-id' };
const GeolocationMapComponent = (props: ShareGeolocationMapProps) => (
  <div
    data-error={props.geolocationPositionError}
    data-latitude={props.latitude}
    data-loading={props.loadingLocation}
    data-longitude={props.longitude}
    data-rw={!!props.restartLocationWatching}
    data-testid={GEOLOCATION_MAP_TEST_ID}
  />
);

const renderComponent = async ({
  channel,
  client,
  props,
}: {
  channel?: ChannelType;
  client?: StreamChat;
  props?: Partial<ShareLocationDialogProps>;
} = {}) => {
  const {
    channels: [defaultChannel],
    client: defaultClient,
  } = await initClientWithChannels({ customUser: user });
  let result: RenderResult;
  await act(() => {
    result = render(
      <Chat client={client ?? defaultClient}>
        <Channel channel={channel ?? defaultChannel}>
          <ShareLocationDialog close={close} {...props} />
        </Channel>
      </Chat>,
    );
  });
  const justRerender = () =>
    result.rerender(
      <Chat client={client ?? defaultClient}>
        <Channel channel={channel ?? defaultChannel}>
          <ShareLocationDialog close={close} {...props} />
        </Channel>
      </Chat>,
    );
  return { channel: defaultChannel, client: defaultClient, justRerender, ...result };
};

const getCurrentPosition = vi.fn().mockImplementation(() => ({}));
const watchPosition = vi.fn().mockImplementation(() => ({}));

(navigator as any).geolocation = {
  clearWatch: vi.fn().mockImplementation(() => ({})),
  getCurrentPosition,
  watchPosition,
};

describe('ShareLocationDialog', () => {
  afterEach(() => {
    // Unmount before clearing mocks so the dialog's clearWatch call is not counted in the next test.
    cleanup();
    vi.clearAllMocks();
  });

  it('renders dropdown with default durations', async () => {
    // The switch is disabled until a geolocation position is available
    const callbacks: Record<string, (...args: unknown[]) => void> = {};
    window.navigator.geolocation.watchPosition['mockImplementation'](
      (onSuccess, onError) => {
        callbacks.onSuccess = onSuccess;
        callbacks.onError = onError;
      },
    );

    const { justRerender } = await renderComponent();
    const coords = { latitude: 1, longitude: 10 };
    await act(() => {
      callbacks.onSuccess({ coords });
      justRerender();
    });

    expect(document.querySelector(DROPDOWN_SELECTOR)).toBeNull();
    await act(async () => {
      await fireEvent.click(screen.getByTestId(SHARE_LIVE_LOCATION_SWITCH_TEST_ID));
    });

    const dropdownTrigger = document.querySelector(DROPDOWN_SELECTOR);
    expect(dropdownTrigger).not.toBeNull();
    await act(async () => {
      await fireEvent.click(dropdownTrigger);
    });
    expect(screen.getAllByText('15 minutes')).toHaveLength(2);
    expect(screen.queryByText('an hour')).toBeInTheDocument();
    expect(screen.queryByText('8 hours')).toBeInTheDocument();
  });

  it('renders dropdown with custom durations', async () => {
    // The switch is disabled until a geolocation position is available
    const callbacks: Record<string, (...args: unknown[]) => void> = {};
    window.navigator.geolocation.watchPosition['mockImplementation'](
      (onSuccess, onError) => {
        callbacks.onSuccess = onSuccess;
        callbacks.onError = onError;
      },
    );

    const { justRerender } = await renderComponent({
      props: { shareDurations: [2 * 60 * 1000, 3 * 60 * 60 * 1000, 10 * 60 * 60 * 1000] },
    });
    const coords = { latitude: 1, longitude: 10 };
    await act(() => {
      callbacks.onSuccess({ coords });
      justRerender();
    });

    expect(document.querySelector(DROPDOWN_SELECTOR)).toBeNull();
    await act(async () => {
      await fireEvent.click(screen.getByTestId(SHARE_LIVE_LOCATION_SWITCH_TEST_ID));
    });

    const dropdownTrigger = document.querySelector(DROPDOWN_SELECTOR);
    expect(dropdownTrigger).not.toBeNull();
    await act(async () => {
      await fireEvent.click(dropdownTrigger);
    });
    expect(screen.getAllByText('2 minutes')).toHaveLength(2);
    expect(screen.queryByText('3 hours')).toBeInTheDocument();
    expect(screen.queryByText('10 hours')).toBeInTheDocument();
  });

  it('renders GeolocationMap component', async () => {
    const callbacks: Record<string, (...args: unknown[]) => void> = {};
    window.navigator.geolocation.watchPosition['mockImplementation'](
      (onSuccess, onError) => {
        callbacks.onSuccess = onSuccess;
        callbacks.onError = onError;
      },
    );
    const { justRerender } = await renderComponent({
      props: { GeolocationMap: GeolocationMapComponent },
    });
    const geolocationMap = screen.getByTestId(GEOLOCATION_MAP_TEST_ID);
    expect(geolocationMap.dataset.latitude).toBeUndefined();
    expect(geolocationMap.dataset.longitude).toBeUndefined();
    expect(geolocationMap.dataset.loading).toBe('true');
    expect(geolocationMap.dataset.error).toBeUndefined();
    expect(geolocationMap.dataset.rw).toBe('true');

    const error = new Error('Geolocation error');
    await act(() => {
      callbacks.onError(error);
      justRerender();
    });

    waitFor(() => {
      expect(geolocationMap.dataset.latitude).toBeUndefined();
      expect(geolocationMap.dataset.longitude).toBeUndefined();
      expect(geolocationMap.dataset.loading).toBe('false');
      expect(geolocationMap.dataset.error).toEqual(error);
    });

    const coords = { latitude: 1, longitude: 10 };
    await act(() => {
      callbacks.onSuccess({ coords });
      justRerender();
    });

    waitFor(() => {
      expect(geolocationMap.dataset.latitude).toBe(coords.latitude);
      expect(geolocationMap.dataset.longitude).toBe(coords.longitude);
      expect(geolocationMap.dataset.loading).toBe('false');
      expect(geolocationMap.dataset.error).toBeUndefined();
    });
  });

  describe('position watching', () => {
    let nextWatchId: number;
    let restartLocationWatching: () => void;
    const RestartingGeolocationMap = (props: ShareGeolocationMapProps) => {
      restartLocationWatching = props.restartLocationWatching;
      return null;
    };

    beforeEach(() => {
      nextWatchId = 1;
      watchPosition.mockImplementation(() => nextWatchId++);
    });

    afterEach(() => {
      watchPosition.mockImplementation(() => ({}));
    });

    it('waits more than a second for a position', async () => {
      await renderComponent();
      expect(watchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        { timeout: 10000 },
      );
    });

    it('clears the current watch before a restart starts a new one', async () => {
      await renderComponent({ props: { GeolocationMap: RestartingGeolocationMap } });
      expect(watchPosition).toHaveBeenCalledTimes(1);
      expect(navigator.geolocation.clearWatch).not.toHaveBeenCalled();

      await act(() => restartLocationWatching());
      expect(navigator.geolocation.clearWatch).toHaveBeenCalledTimes(1);
      expect(navigator.geolocation.clearWatch).toHaveBeenLastCalledWith(1);
      expect(watchPosition).toHaveBeenCalledTimes(2);

      await act(() => restartLocationWatching());
      expect(navigator.geolocation.clearWatch).toHaveBeenCalledTimes(2);
      expect(navigator.geolocation.clearWatch).toHaveBeenLastCalledWith(2);
      expect(watchPosition).toHaveBeenCalledTimes(3);
    });

    it('clears the watch started by a restart on unmount', async () => {
      const { unmount } = await renderComponent({
        props: { GeolocationMap: RestartingGeolocationMap },
      });
      await act(() => restartLocationWatching());
      vi.mocked(navigator.geolocation.clearWatch).mockClear();

      unmount();
      expect(navigator.geolocation.clearWatch).toHaveBeenCalledTimes(1);
      expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(2);
    });

    it('clears the initial watch on unmount', async () => {
      const { unmount } = await renderComponent();
      unmount();
      expect(navigator.geolocation.clearWatch).toHaveBeenCalledTimes(1);
      expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(1);
    });

    it('ignores callbacks of a watch stopped by a restart', async () => {
      const watchCallbacks: Array<Record<string, (...args: unknown[]) => void>> = [];
      watchPosition.mockImplementation((onSuccess, onError) => {
        watchCallbacks.push({ onError, onSuccess });
        return nextWatchId++;
      });
      const RestartableGeolocationMap = (props: ShareGeolocationMapProps) => (
        <>
          <RestartingGeolocationMap {...props} />
          <GeolocationMapComponent {...props} />
        </>
      );
      await renderComponent({ props: { GeolocationMap: RestartableGeolocationMap } });
      const geolocationMap = screen.getByTestId(GEOLOCATION_MAP_TEST_ID);
      await act(() => restartLocationWatching());
      const [stoppedWatch, currentWatch] = watchCallbacks;

      await act(() => stoppedWatch.onSuccess({ coords: { latitude: 1, longitude: 10 } }));
      expect(geolocationMap.dataset.latitude).toBeUndefined();
      expect(geolocationMap.dataset.loading).toBe('true');

      await act(() => currentWatch.onSuccess({ coords: { latitude: 2, longitude: 20 } }));
      await act(() =>
        stoppedWatch.onError({ code: 2, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }),
      );
      expect(geolocationMap.dataset.latitude).toBe('2');
      expect(geolocationMap.dataset.error).toBeUndefined();
    });

    it('keeps one watch under StrictMode', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({ customUser: user });
      let result: RenderResult;
      await act(() => {
        result = render(
          <React.StrictMode>
            <Chat client={client}>
              <Channel channel={channel}>
                <ShareLocationDialog close={close} />
              </Channel>
            </Chat>
          </React.StrictMode>,
        );
      });
      const startedWatchIds = watchPosition.mock.results.map((r) => r.value);
      const clearedWatchIds = () =>
        vi.mocked(navigator.geolocation.clearWatch).mock.calls.map(([id]) => id);
      const activeWatchIds = () =>
        startedWatchIds.filter((id) => !clearedWatchIds().includes(id));
      expect(activeWatchIds()).toHaveLength(1);

      result.unmount();
      expect(activeWatchIds()).toHaveLength(0);
    });

    it('keeps the last position when a later update times out', async () => {
      const callbacks: Record<string, (...args: unknown[]) => void> = {};
      watchPosition.mockImplementation((onSuccess, onError) => {
        callbacks.onSuccess = onSuccess;
        callbacks.onError = onError;
        return nextWatchId++;
      });
      await renderComponent({ props: { GeolocationMap: GeolocationMapComponent } });
      const geolocationMap = screen.getByTestId(GEOLOCATION_MAP_TEST_ID);
      const coords = { latitude: 1, longitude: 10 };

      await act(() => callbacks.onSuccess({ coords }));
      await act(() => callbacks.onError({ code: 3, TIMEOUT: 3 }));

      expect(geolocationMap.dataset.latitude).toBe(String(coords.latitude));
      expect(geolocationMap.dataset.longitude).toBe(String(coords.longitude));
      expect(geolocationMap.dataset.error).toBeUndefined();
      expect(screen.getByRole('button', { name: 'Share' })).toBeEnabled();
    });

    it('clears the position on a non-timeout error after a position', async () => {
      const callbacks: Record<string, (...args: unknown[]) => void> = {};
      watchPosition.mockImplementation((onSuccess, onError) => {
        callbacks.onSuccess = onSuccess;
        callbacks.onError = onError;
        return nextWatchId++;
      });
      await renderComponent({ props: { GeolocationMap: GeolocationMapComponent } });
      const geolocationMap = screen.getByTestId(GEOLOCATION_MAP_TEST_ID);

      await act(() => callbacks.onSuccess({ coords: { latitude: 1, longitude: 10 } }));
      await act(() =>
        callbacks.onError({ code: 2, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }),
      );

      expect(geolocationMap.dataset.latitude).toBeUndefined();
      expect(geolocationMap.dataset.error).toBeDefined();
      expect(screen.getByRole('button', { name: 'Share' })).toBeDisabled();
    });

    it('shows a timeout that happens before the first position', async () => {
      const callbacks: Record<string, (...args: unknown[]) => void> = {};
      watchPosition.mockImplementation((onSuccess, onError) => {
        callbacks.onSuccess = onSuccess;
        callbacks.onError = onError;
        return nextWatchId++;
      });
      await renderComponent({ props: { GeolocationMap: GeolocationMapComponent } });
      const geolocationMap = screen.getByTestId(GEOLOCATION_MAP_TEST_ID);

      await act(() => callbacks.onError({ code: 3, TIMEOUT: 3 }));

      expect(geolocationMap.dataset.loading).toBe('false');
      expect(geolocationMap.dataset.error).toBeDefined();
      expect(screen.getByRole('button', { name: 'Share' })).toBeDisabled();
    });

    it('shows loading again after a restart', async () => {
      let onError: (error: unknown) => void = () => undefined;
      watchPosition.mockImplementation((_onSuccess, onErrorCallback) => {
        onError = onErrorCallback;
        return nextWatchId++;
      });
      const RestartableGeolocationMap = (props: ShareGeolocationMapProps) => (
        <>
          <RestartingGeolocationMap {...props} />
          <GeolocationMapComponent {...props} />
        </>
      );
      await renderComponent({ props: { GeolocationMap: RestartableGeolocationMap } });
      const geolocationMap = screen.getByTestId(GEOLOCATION_MAP_TEST_ID);

      await act(() => onError(new Error('timeout')));
      expect(geolocationMap.dataset.loading).toBe('false');

      await act(() => restartLocationWatching());
      expect(geolocationMap.dataset.loading).toBe('true');
    });
  });

  it('closes the dialog', async () => {
    await renderComponent({ props: { close } });
    const messageComposer = useMessageComposerController();
    await act(async () => {
      await fireEvent.click(screen.getByText('Cancel'));
    });
    expect(close).toHaveBeenCalledTimes(1);
    expect(messageComposer.locationComposer.initState).toHaveBeenCalledTimes(1);
  });

  it('attaches the position to message composition', async () => {
    const callbacks: Record<string, (...args: unknown[]) => void> = {};
    window.navigator.geolocation.watchPosition['mockImplementation'](
      (onSuccess, onError) => {
        callbacks.onSuccess = onSuccess;
        callbacks.onError = onError;
      },
    );

    const { justRerender } = await renderComponent({ props: { close } });
    const messageComposer = useMessageComposerController();
    const coords = { latitude: 1, longitude: 10 };
    await act(() => {
      callbacks.onSuccess({ coords });
      justRerender();
    });
    waitFor(() => {
      expect(screen.getByText('Attach')).toBeEnabled();
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Attach'));
    });
    expect(close).toHaveBeenCalledTimes(1);
    expect(messageComposer.locationComposer.initState).not.toHaveBeenCalledTimes(1);
    expect(messageComposer.locationComposer.setData).toHaveBeenCalledWith(
      expect.objectContaining({ ...coords, durationMs: undefined }),
    );
  });

  it('sends message with the position directly', async () => {
    const callbacks: Record<string, (...args: unknown[]) => void> = {};
    window.navigator.geolocation.watchPosition['mockImplementation'](
      (onSuccess, onError) => {
        callbacks.onSuccess = onSuccess;
        callbacks.onError = onError;
      },
    );

    const { justRerender } = await renderComponent({ props: { close } });
    const messageComposer = useMessageComposerController();
    const coords = { latitude: 1, longitude: 10 };
    await act(() => {
      callbacks.onSuccess({ coords });
      justRerender();
    });
    waitFor(() => {
      expect(screen.getByText('Share')).toBeEnabled();
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Share'));
    });
    expect(close).toHaveBeenCalledTimes(1);
    expect(messageComposer.locationComposer.initState).not.toHaveBeenCalledTimes(1);
    expect(messageComposer.locationComposer.setData).toHaveBeenCalledWith(
      expect.objectContaining({ ...coords, durationMs: undefined }),
    );
    expect(messageComposer.sendLocation).toHaveBeenCalledTimes(1);
  });
});
