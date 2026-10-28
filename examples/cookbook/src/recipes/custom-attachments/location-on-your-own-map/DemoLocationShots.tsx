import { useEffect } from 'react';
import type {
  MessageResponse,
  SharedLocationResponseData,
  StreamChat,
} from 'stream-chat';
import { formatMessage, msToNs } from 'stream-chat';
import { useChatContext } from 'stream-chat-react';
import { isDemoChannelId } from '../../../base/client';

/**
 * For the screenshots only, not part of the recipe. The demo app refuses shared locations and the
 * cookbook sends nothing, so this fakes what the page shows, on this device only:
 * - `?geolocation=fixed` makes `navigator.geolocation` report a fixed position in a public park,
 *   and `?geolocation=denied` makes it refuse, as a browser does when the user blocks access.
 * - `?dialog=open` opens the Share Location dialog from the attachment menu of the channel
 *   `?channel=`, and `?dialog=live` also turns on "Share live location for".
 * - `?attach=live` puts a live location in that channel's composer, as Attach in the dialog does.
 * - `?locations=on` adds four location messages to that channel's list, as if they had been
 *   shared: an ended live location from Bob, a static one from Bob, and live ones from Cara and
 *   from Cleo, the user. Reloading the page drops them.
 */

const PARK = { latitude: 52.358, longitude: 4.8686 };

const fakePosition = (): GeolocationPosition =>
  ({
    coords: {
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: PARK.latitude,
      longitude: PARK.longitude,
      speed: null,
    },
    timestamp: Date.now(),
  }) as GeolocationPosition;

const deniedError = {
  code: 1,
  message: 'User denied Geolocation',
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
} as GeolocationPositionError;

const installFakeGeolocation = (mode: string) => {
  const report = (success: PositionCallback, error?: PositionErrorCallback | null) =>
    setTimeout(
      () => (mode === 'denied' ? error?.(deniedError) : success(fakePosition())),
      300,
    );

  const fake: Geolocation = {
    clearWatch: (id) => clearTimeout(id),
    getCurrentPosition: (success, error) => {
      report(success, error);
    },
    watchPosition: (success, error) => report(success, error) as unknown as number,
  };
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: fake });
};

const clickWhenReady = (selector: string, then?: () => void) => {
  const timer = setInterval(() => {
    const element = document.querySelector<HTMLElement & { disabled?: boolean }>(
      selector,
    );
    if (!element || element.disabled) return;
    clearInterval(timer);
    element.click();
    then?.();
  }, 200);
  return () => clearInterval(timer);
};

const MENU_BUTTON = '.str-chat__channel .str-chat__attachment-selector__menu-button';
const LOCATION_ITEM = '.str-chat__attachment-selector-actions-menu__add-location-button';
const LIVE_SWITCH = '[data-testid="share-location-dialog-live-location-switch"]';
const MINUTE = 60_000;

type DemoLocation = {
  id: string;
  latitude: number;
  longitude: number;
  userId: string;
  /** Minutes from now; negative is in the past. */
  createdIn: number;
  updatedIn: number;
  endsIn?: number;
};

const demoLocations = (cleoId: string): DemoLocation[] => [
  {
    createdIn: -40,
    endsIn: -10,
    id: 'cookbook-local-location-ended',
    latitude: 52.3602,
    longitude: 4.8744,
    updatedIn: -10,
    userId: 'docs-v15-ck-bob',
  },
  {
    createdIn: -9,
    id: 'cookbook-local-location-static',
    latitude: 52.3571,
    longitude: 4.8641,
    updatedIn: -9,
    userId: 'docs-v15-ck-bob',
  },
  {
    createdIn: -6,
    endsIn: 54,
    id: 'cookbook-local-location-live-other',
    latitude: 52.3589,
    longitude: 4.8712,
    updatedIn: -1,
    userId: 'docs-v15-ck-cara',
  },
  {
    createdIn: -4,
    endsIn: 56,
    id: 'cookbook-local-location-live-own',
    latitude: PARK.latitude,
    longitude: PARK.longitude,
    updatedIn: -2,
    userId: cleoId,
  },
];

const addDemoLocations = (client: StreamChat, channelId: string) => {
  const channel = client.channel('messaging', channelId);
  const members = channel.state.getLatestValue().members;
  const now = Date.now();
  const at = (minutes: number) => msToNs(now + minutes * MINUTE);

  for (const location of demoLocations(client.userId ?? '')) {
    const user = members[location.userId]?.user;
    if (!user) continue;
    const sharedLocation: SharedLocationResponseData = {
      channel_cid: channel.cid,
      created_at: at(location.createdIn),
      created_by_device_id: 'cookbook-demo-device',
      latitude: location.latitude,
      longitude: location.longitude,
      message_id: location.id,
      updated_at: at(location.updatedIn),
      user_id: location.userId,
      ...(location.endsIn !== undefined ? { end_at: at(location.endsIn) } : {}),
    };
    const message: MessageResponse = {
      attachments: [],
      cid: channel.cid,
      created_at: at(location.createdIn),
      custom: {},
      deleted_reply_count: 0,
      html: '',
      id: location.id,
      latest_reactions: [],
      mentioned_channel: false,
      mentioned_here: false,
      mentioned_users: [],
      own_reactions: [],
      pinned: false,
      reaction_counts: {},
      reaction_scores: {},
      reply_count: 0,
      restricted_visibility: [],
      shadowed: false,
      shared_location: sharedLocation,
      silent: false,
      text: '',
      type: 'regular',
      updated_at: at(location.updatedIn),
      user,
    };
    channel.messagePaginator.ingestItem(formatMessage(message));
  }
};

export const DemoLocationShots = () => {
  const { client } = useChatContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const geolocation = params.get('geolocation');
    if (geolocation) installFakeGeolocation(geolocation);

    const channelId = params.get('channel');
    if (!isDemoChannelId(channelId)) return;
    const dialog = params.get('dialog');
    const attach = params.get('attach');
    const locations = params.get('locations');
    const channel = client.channel('messaging', channelId);
    const stops: Array<() => void> = [];

    // Waits for the channel's first page and for its composer, which resets its state while it sets up.
    const timer = setInterval(() => {
      if (
        !channel.messagePaginator.items?.length ||
        !document.querySelector('.str-chat__channel textarea')
      )
        return;
      clearInterval(timer);

      if (locations === 'on') addDemoLocations(client, channelId);

      if (attach === 'live') {
        channel.messageComposer.locationComposer.setData({
          ...PARK,
          durationMs: 60 * MINUTE,
        });
      }

      if (dialog) {
        stops.push(
          clickWhenReady(MENU_BUTTON, () =>
            stops.push(
              clickWhenReady(LOCATION_ITEM, () => {
                if (dialog === 'live') stops.push(clickWhenReady(LIVE_SWITCH));
              }),
            ),
          ),
        );
      }
    }, 200);
    stops.push(() => clearInterval(timer));

    return () => stops.forEach((stop) => stop());
  }, [client]);

  return null;
};
