import React from 'react';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { Geolocation } from '../Geolocation';
import {
  generateLiveLocationResponse,
  generateStaticLocationResponse,
  initClientWithChannels,
} from '../../../mock-builders';

const GeolocationMapComponent = (props) => (
  <div data-props={props} data-testid='geolocation-map' />
);
const GeolocationAttachmentMapPlaceholderComponent = (props) => (
  <div data-props={props} data-testid='geolocation-attachment-map-placeholder-custom' />
);

const getStopSharingButton = () =>
  screen.queryByRole('button', { name: /stop sharing/i });
const getLocationSharingEndedLabel = () => screen.queryByText('Location sharing ended');
const getStaticLocationLabel = () => screen.queryByText('Current location');
const getOtherUsersLiveLocationLabel = () => screen.queryByText('Live location');
const getGeolocationAttachmentMapPlaceholder = () =>
  screen.queryByTestId('geolocation-attachment-map-placeholder');
const getCustomGeolocationAttachmentMapPlaceholder = () =>
  screen.queryByTestId('geolocation-attachment-map-placeholder-custom');
const getGeolocationMap = () => screen.queryByTestId('geolocation-map');

const ownUser = { id: 'user-id' };
const otherUser = { id: 'other-user-id' };

const renderComponent = async ({ channel, client, props } = {}) => {
  const {
    channels: [defaultChannel],
    client: defaultClient,
  } = await initClientWithChannels({ customUser: ownUser });
  let result;
  await act(() => {
    result = render(
      <Chat client={client ?? defaultClient}>
        <Channel channel={channel ?? defaultChannel}>
          <Geolocation {...props} />
        </Channel>
      </Chat>,
    );
  });
  return { channel: defaultChannel, client: defaultClient, result };
};

describe.each([
  ['with', 'with', GeolocationMapComponent, GeolocationAttachmentMapPlaceholderComponent],
  ['with', 'without', GeolocationMapComponent, undefined],
  ['without', 'with', undefined, GeolocationAttachmentMapPlaceholderComponent],
  ['without', 'without', undefined, undefined],
])(
  'Geolocation attachment %s GeolocationMap and %s GeolocationAttachmentMapPlaceholder',
  (_, __, GeolocationMap, GeolocationAttachmentMapPlaceholder) => {
    it('renders own static location', async () => {
      const location = generateStaticLocationResponse({ user_id: ownUser.id });
      await renderComponent({
        props: { GeolocationAttachmentMapPlaceholder, GeolocationMap, location },
      });
      expect(getStopSharingButton()).not.toBeInTheDocument();
      expect(getLocationSharingEndedLabel()).not.toBeInTheDocument();
      expect(getOtherUsersLiveLocationLabel()).not.toBeInTheDocument();
      expect(getStaticLocationLabel()).toBeInTheDocument();
      if (GeolocationMap) {
        expect(getGeolocationMap()).toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
      } else if (GeolocationAttachmentMapPlaceholder) {
        expect(getGeolocationMap()).not.toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).toBeInTheDocument();
      } else {
        expect(getGeolocationMap()).not.toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
      }
    });

    it("renders other user's static location", async () => {
      const location = generateStaticLocationResponse({ user_id: otherUser.id });
      await renderComponent({
        props: { GeolocationAttachmentMapPlaceholder, GeolocationMap, location },
      });
      expect(getStopSharingButton()).not.toBeInTheDocument();
      expect(getLocationSharingEndedLabel()).not.toBeInTheDocument();
      expect(getOtherUsersLiveLocationLabel()).not.toBeInTheDocument();
      expect(getStaticLocationLabel()).toBeInTheDocument();
      if (GeolocationMap) {
        expect(getGeolocationMap()).toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
      } else if (GeolocationAttachmentMapPlaceholder) {
        expect(getGeolocationMap()).not.toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).toBeInTheDocument();
      } else {
        expect(getGeolocationMap()).not.toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
      }
    });

    it('renders own live location', async () => {
      const location = generateLiveLocationResponse({
        end_at: new Date(Date.now() + 10000).toISOString(),
        user_id: ownUser.id,
      });
      await renderComponent({
        props: { GeolocationAttachmentMapPlaceholder, GeolocationMap, location },
      });
      expect(getStopSharingButton()).toBeInTheDocument();
      expect(getLocationSharingEndedLabel()).not.toBeInTheDocument();
      expect(getOtherUsersLiveLocationLabel()).not.toBeInTheDocument();
      expect(getStaticLocationLabel()).not.toBeInTheDocument();
      if (GeolocationMap) {
        expect(getGeolocationMap()).toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
      } else if (GeolocationAttachmentMapPlaceholder) {
        expect(getGeolocationMap()).not.toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).toBeInTheDocument();
      } else {
        expect(getGeolocationMap()).not.toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
      }
    });
    it("other user's live location", async () => {
      const location = generateLiveLocationResponse({
        end_at: new Date(Date.now() + 10000).toISOString(),
        user_id: otherUser.id,
      });
      await renderComponent({
        props: { GeolocationAttachmentMapPlaceholder, GeolocationMap, location },
      });
      expect(getStopSharingButton()).not.toBeInTheDocument();
      expect(getLocationSharingEndedLabel()).not.toBeInTheDocument();
      expect(getOtherUsersLiveLocationLabel()).toBeInTheDocument();
      expect(getStaticLocationLabel()).not.toBeInTheDocument();
      if (GeolocationMap) {
        expect(getGeolocationMap()).toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
      } else if (GeolocationAttachmentMapPlaceholder) {
        expect(getGeolocationMap()).not.toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).toBeInTheDocument();
      } else {
        expect(getGeolocationMap()).not.toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
      }
    });
    it("own user's stopped live location", async () => {
      const location = generateLiveLocationResponse({
        end_at: '1980-01-01T00:00:00.000Z',
        user_id: ownUser.id,
      });
      await renderComponent({
        props: { GeolocationAttachmentMapPlaceholder, GeolocationMap, location },
      });
      expect(getStopSharingButton()).not.toBeInTheDocument();
      expect(getLocationSharingEndedLabel()).toBeInTheDocument();
      expect(getOtherUsersLiveLocationLabel()).not.toBeInTheDocument();
      expect(getStaticLocationLabel()).not.toBeInTheDocument();
      if (GeolocationMap) {
        expect(getGeolocationMap()).toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
      } else if (GeolocationAttachmentMapPlaceholder) {
        expect(getGeolocationMap()).not.toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).toBeInTheDocument();
      } else {
        expect(getGeolocationMap()).not.toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
      }
    });
    it("other user's stopped live location", async () => {
      const location = generateLiveLocationResponse({
        end_at: '1980-01-01T00:00:00.000Z',
        user_id: otherUser.id,
      });
      await renderComponent({
        props: { GeolocationAttachmentMapPlaceholder, GeolocationMap, location },
      });
      expect(getStopSharingButton()).not.toBeInTheDocument();
      expect(getLocationSharingEndedLabel()).toBeInTheDocument();
      expect(getOtherUsersLiveLocationLabel()).not.toBeInTheDocument();
      expect(getStaticLocationLabel()).not.toBeInTheDocument();
      if (GeolocationMap) {
        expect(getGeolocationMap()).toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
      } else if (GeolocationAttachmentMapPlaceholder) {
        expect(getGeolocationMap()).not.toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).toBeInTheDocument();
      } else {
        expect(getGeolocationMap()).not.toBeInTheDocument();
        expect(getGeolocationAttachmentMapPlaceholder()).toBeInTheDocument();
        expect(getCustomGeolocationAttachmentMapPlaceholder()).not.toBeInTheDocument();
      }
    });
  },
);
