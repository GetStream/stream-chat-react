import React from 'react';
import { act, renderHook } from '@testing-library/react';

import { ChatContext } from '../../../../context/ChatContext';
import { TranslationProvider } from '../../../../context/TranslationContext';
import {
  generateChannel,
  generateMember,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../../mock-builders';
import { useChannelPreviewInfo } from '../useChannelPreviewInfo';

const clientUser = generateUser({ id: 'current-user' });

const getClientAndChannel = async (channelOverrides = {}) => {
  const client = await getTestClientWithUser(clientUser);
  const mockedChannel = generateChannel({
    members: [
      generateMember({ user: clientUser }),
      generateMember({ user: generateUser() }),
    ],
    ...channelOverrides,
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]);

  const channel = client.channel('messaging', mockedChannel.channel.id);
  await channel.watch();

  return { channel, client };
};

const createWrapper = (client) =>
  function Wrapper({ children }) {
    return (
      <ChatContext.Provider
        value={{
          client,
          theme: 'messaging light',
        }}
      >
        <TranslationProvider value={{ t: (key) => key }}>{children}</TranslationProvider>
      </ChatContext.Provider>
    );
  };

describe('useChannelPreviewInfo', () => {
  describe('without channel', () => {
    it('returns undefined displayTitle and displayImage, empty groupChannelDisplayInfo', () => {
      const client = { off: jest.fn(), on: jest.fn() };
      const { result } = renderHook(() => useChannelPreviewInfo({}), {
        wrapper: createWrapper(client),
      });

      expect(result.current.displayTitle).toBeUndefined();
      expect(result.current.displayImage).toBeUndefined();
      expect(result.current.groupChannelDisplayInfo).toEqual({
        members: [],
        overflowCount: undefined,
      });
      expect(client.on).not.toHaveBeenCalled();
    });
  });

  describe('with channel', () => {
    it('returns displayTitle from channel (via useChannelDisplayName)', async () => {
      const channelName = 'Test Channel';
      const { channel, client } = await getClientAndChannel({
        channel: { name: channelName },
      });

      const { result } = renderHook(() => useChannelPreviewInfo({ channel }), {
        wrapper: createWrapper(client),
      });

      expect(result.current.displayTitle).toBe(channelName);
    });

    it('returns displayImage from channel.data.image', async () => {
      const imageUrl = 'https://channel-image.jpg';
      const { channel, client } = await getClientAndChannel({
        channel: { image: imageUrl },
      });

      const { result } = renderHook(() => useChannelPreviewInfo({ channel }), {
        wrapper: createWrapper(client),
      });

      expect(result.current.displayImage).toBe(imageUrl);
    });

    it('returns groupChannelDisplayInfo with empty members for 2-member channel', async () => {
      const { channel, client } = await getClientAndChannel();

      const { result } = renderHook(() => useChannelPreviewInfo({ channel }), {
        wrapper: createWrapper(client),
      });

      expect(result.current.groupChannelDisplayInfo).toEqual({
        members: [],
        overflowCount: undefined,
      });
    });

    it('returns groupChannelDisplayInfo with members for 3+ member channel', async () => {
      const { channel, client } = await getClientAndChannel({
        members: [
          generateMember({ user: generateUser({ image: 'a.jpg', name: 'A' }) }),
          generateMember({ user: generateUser({ image: 'b.jpg', name: 'B' }) }),
          generateMember({ user: clientUser }),
        ],
      });

      const { result } = renderHook(() => useChannelPreviewInfo({ channel }), {
        wrapper: createWrapper(client),
      });

      expect(
        result.current.groupChannelDisplayInfo.members.length,
      ).toBeGreaterThanOrEqual(2);
      expect(
        result.current.groupChannelDisplayInfo.members.every(
          (m) => 'imageUrl' in m && 'userName' in m,
        ),
      ).toBe(true);
    });

    it('uses overrideTitle over channel display title', async () => {
      const { channel, client } = await getClientAndChannel({
        channel: { name: 'Channel Name' },
      });

      const { result } = renderHook(
        () => useChannelPreviewInfo({ channel, overrideTitle: 'Custom Title' }),
        { wrapper: createWrapper(client) },
      );

      expect(result.current.displayTitle).toBe('Custom Title');
    });

    it('uses overrideImage over channel display image', async () => {
      const { channel, client } = await getClientAndChannel({
        channel: { image: 'https://channel.jpg' },
      });

      const { result } = renderHook(
        () => useChannelPreviewInfo({ channel, overrideImage: 'https://override.jpg' }),
        { wrapper: createWrapper(client) },
      );

      expect(result.current.displayImage).toBe('https://override.jpg');
    });

    it('subscribes to user.updated and updates displayImage and groupChannelDisplayInfo', async () => {
      const imageUrl = 'https://initial.jpg';
      const { channel, client } = await getClientAndChannel({
        channel: { image: imageUrl },
      });

      const { result } = renderHook(() => useChannelPreviewInfo({ channel }), {
        wrapper: createWrapper(client),
      });

      expect(result.current.displayImage).toBe(imageUrl);
      expect(client.on).toHaveBeenCalledWith('user.updated', expect.any(Function));

      const updateInfo = client.on.mock.calls.find((c) => c[0] === 'user.updated')?.[1];
      expect(updateInfo).toBeDefined();

      act(() => {
        updateInfo();
      });

      expect(result.current.displayImage).toBe(imageUrl);
    });

    it('does not subscribe to user.updated when overrideImage is set', async () => {
      const { channel, client } = await getClientAndChannel({
        channel: { image: 'https://channel.jpg' },
      });

      renderHook(
        () => useChannelPreviewInfo({ channel, overrideImage: 'https://override.jpg' }),
        { wrapper: createWrapper(client) },
      );

      expect(client.on).not.toHaveBeenCalled();
    });

    it('unsubscribes from user.updated on unmount', async () => {
      const { channel, client } = await getClientAndChannel();

      const { unmount } = renderHook(() => useChannelPreviewInfo({ channel }), {
        wrapper: createWrapper(client),
      });

      expect(client.on).toHaveBeenCalledWith('user.updated', expect.any(Function));
      const updateInfo = client.on.mock.calls[0][1];

      unmount();

      expect(client.off).toHaveBeenCalledWith('user.updated', updateInfo);
    });
  });
});
