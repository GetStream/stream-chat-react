import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { initClientWithChannels } from '../../../mock-builders';
import { ShareLocationDialog } from '../ShareLocationDialog';
import { useMessageComposer } from '../../MessageInput';

jest.mock('../../MessageInput/hooks/useMessageComposer', () => ({
  useMessageComposer: jest.fn().mockReturnValue({
    locationComposer: {
      initState: jest.fn(),
      setData: jest.fn(),
    },
    sendLocation: jest.fn(),
  }),
}));

const DROPDOWN_OPEN_BTN_TEST_ID = 'dropdown-open-button';
const SHARE_LIVE_LOCATION_SWITCH_TEST_ID = 'share-location-dialog-live-location-switch';
const GEOLOCATION_MAP_TEST_ID = 'geolocation-map';

const close = jest.fn().mockImplementation();
const user = { id: 'user-id' };
const GeolocationMapComponent = (props) => (
  <div
    data-error={props.geolocationPositionError}
    data-latitude={props.latitude}
    data-loading={props.loadingLocation}
    data-longitude={props.longitude}
    data-rw={!!props.restartLocationWatching}
    data-testid={GEOLOCATION_MAP_TEST_ID}
  />
);

const renderComponent = async ({ channel, client, props } = {}) => {
  const {
    channels: [defaultChannel],
    client: defaultClient,
  } = await initClientWithChannels({ customUser: user });
  let result;
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

const getCurrentPosition = jest.fn().mockImplementation(() => ({}));
const watchPosition = jest.fn().mockImplementation(() => ({}));

window.navigator.geolocation = {
  clearWatch: jest.fn().mockImplementation(() => ({})),
  getCurrentPosition,
  watchPosition,
};

describe('ShareLocationDialog', () => {
  afterEach(jest.clearAllMocks);
  it('renders dropdown with default durations', async () => {
    // check send button is enabled after selection
    await renderComponent();
    expect(screen.queryByTestId(DROPDOWN_OPEN_BTN_TEST_ID)).not.toBeInTheDocument();
    await act(async () => {
      await fireEvent.click(screen.getByTestId(SHARE_LIVE_LOCATION_SWITCH_TEST_ID));
    });

    await act(async () => {
      await fireEvent.click(screen.getByTestId(DROPDOWN_OPEN_BTN_TEST_ID));
    });
    expect(screen.getAllByText('15 minutes')).toHaveLength(2);
    expect(screen.queryByText('an hour')).toBeInTheDocument();
    expect(screen.queryByText('8 hours')).toBeInTheDocument();
  });

  it('renders dropdown with custom durations', async () => {
    // check send button is enabled after selection
    await renderComponent({
      props: { shareDurations: [2 * 60 * 1000, 3 * 60 * 60 * 1000, 10 * 60 * 60 * 1000] },
    });
    expect(screen.queryByTestId(DROPDOWN_OPEN_BTN_TEST_ID)).not.toBeInTheDocument();
    await act(async () => {
      await fireEvent.click(screen.getByTestId(SHARE_LIVE_LOCATION_SWITCH_TEST_ID));
    });

    await act(async () => {
      await fireEvent.click(screen.getByTestId(DROPDOWN_OPEN_BTN_TEST_ID));
    });
    expect(screen.getAllByText('2 minutes')).toHaveLength(2);
    expect(screen.queryByText('3 hours')).toBeInTheDocument();
    expect(screen.queryByText('10 hours')).toBeInTheDocument();
  });

  it('renders GeolocationMap component', async () => {
    const callbacks = {};
    window.navigator.geolocation.watchPosition.mockImplementation(
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

  it('closes the dialog', async () => {
    await renderComponent({ props: { close } });
    const messageComposer = useMessageComposer();
    await act(async () => {
      await fireEvent.click(screen.getByText('Cancel'));
    });
    expect(close).toHaveBeenCalledTimes(1);
    expect(messageComposer.locationComposer.initState).toHaveBeenCalledTimes(1);
  });

  it('attaches the position to message composition', async () => {
    const callbacks = {};
    window.navigator.geolocation.watchPosition.mockImplementation(
      (onSuccess, onError) => {
        callbacks.onSuccess = onSuccess;
        callbacks.onError = onError;
      },
    );

    const { justRerender } = await renderComponent({ props: { close } });
    const messageComposer = useMessageComposer();
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
    const callbacks = {};
    window.navigator.geolocation.watchPosition.mockImplementation(
      (onSuccess, onError) => {
        callbacks.onSuccess = onSuccess;
        callbacks.onError = onError;
      },
    );

    const { justRerender } = await renderComponent({ props: { close } });
    const messageComposer = useMessageComposer();
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
