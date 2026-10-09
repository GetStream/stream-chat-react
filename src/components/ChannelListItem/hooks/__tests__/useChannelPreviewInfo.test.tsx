import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Event } from 'stream-chat';

import { ChatContext } from '../../../../context/ChatContext';
import type { ChatContextValue } from '../../../../context/ChatContext';
import { TranslationProvider } from '../../../../context/TranslationContext';
import {
  generateChannel,
  generateMember,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  mockTranslationContextValue,
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

  const channel = client.channelManager.ensure({
    id: mockedChannel.channel.id,
    type: 'messaging',
  });
  await channel.watch();

  return { channel, client };
};

const createWrapper = (client) =>
  function Wrapper({ children }) {
    return (
      <ChatContext.Provider
        value={fromPartial<ChatContextValue>({
          client,
          theme: 'messaging light',
        })}
      >
        <TranslationProvider value={mockTranslationContextValue()}>
          {children}
        </TranslationProvider>
      </ChatContext.Provider>
    );
  };

describe('useChannelPreviewInfo', () => {
  describe('without channel', () => {
    it('returns undefined displayTitle and displayImage, empty groupChannelDisplayInfo', () => {
      const client = { off: vi.fn(), on: vi.fn() };
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
        channel: { custom: { name: channelName } },
      });

      const { result } = renderHook(() => useChannelPreviewInfo({ channel }), {
        wrapper: createWrapper(client),
      });

      expect(result.current.displayTitle).toBe(channelName);
    });

    it('returns displayImage from channel.data.custom.image', async () => {
      const imageUrl = 'https://channel-image.jpg';
      const { channel, client } = await getClientAndChannel({
        channel: { custom: { image: imageUrl } },
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

    it('does not re-render a group channel when a user outside it is updated', async () => {
      const { channel, client } = await getClientAndChannel({
        members: [
          generateMember({ user: generateUser({ image: 'a.jpg', name: 'A' }) }),
          generateMember({ user: generateUser({ image: 'b.jpg', name: 'B' }) }),
          generateMember({ user: clientUser }),
        ],
      });
      let renders = 0;
      const { result } = renderHook(
        () => {
          renders += 1;
          return useChannelPreviewInfo({ channel });
        },
        { wrapper: createWrapper(client) },
      );
      const before = result.current;
      const rendersBefore = renders;

      act(() => {
        client.dispatchEvent(
          fromPartial<Event>({
            type: 'user.updated',
            user: generateUser({ id: 'outsider', name: 'Outsider' }),
          }),
        );
      });

      expect(renders).toBe(rendersBefore);
      expect(result.current).toBe(before);
    });

    it('uses overrideTitle over channel display title', async () => {
      const { channel, client } = await getClientAndChannel({
        channel: { custom: { name: 'Channel Name' } },
      });

      const { result } = renderHook(
        () => useChannelPreviewInfo({ channel, overrideTitle: 'Custom Title' }),
        { wrapper: createWrapper(client) },
      );

      expect(result.current.displayTitle).toBe('Custom Title');
    });

    it('uses overrideImage over channel display image', async () => {
      const { channel, client } = await getClientAndChannel({
        channel: { custom: { image: 'https://channel.jpg' } },
      });

      const { result } = renderHook(
        () => useChannelPreviewInfo({ channel, overrideImage: 'https://override.jpg' }),
        { wrapper: createWrapper(client) },
      );

      expect(result.current.displayImage).toBe('https://override.jpg');
    });

    it('shows an updated member in a DM title and image', async () => {
      const other = generateUser({ id: 'other', image: 'before.jpg', name: 'Before' });
      const { channel, client } = await getClientAndChannel({
        members: [generateMember({ user: clientUser }), generateMember({ user: other })],
      });
      const { result } = renderHook(() => useChannelPreviewInfo({ channel }), {
        wrapper: createWrapper(client),
      });
      expect(result.current.displayTitle).toBe('Before');
      expect(result.current.displayImage).toBe('before.jpg');

      act(() => {
        client.dispatchEvent(
          fromPartial<Event>({
            type: 'user.updated',
            user: { ...other, image: 'after.jpg', name: 'After' },
          }),
        );
      });

      expect(result.current.displayTitle).toBe('After');
      expect(result.current.displayImage).toBe('after.jpg');
    });

    it('shows an updated member in the group members', async () => {
      const a = generateUser({ id: 'a', image: 'a.jpg', name: 'A' });
      const { channel, client } = await getClientAndChannel({
        members: [
          generateMember({ user: a }),
          generateMember({ user: generateUser({ image: 'b.jpg', name: 'B' }) }),
          generateMember({ user: clientUser }),
        ],
      });
      const { result } = renderHook(() => useChannelPreviewInfo({ channel }), {
        wrapper: createWrapper(client),
      });

      act(() => {
        client.dispatchEvent(
          fromPartial<Event>({
            type: 'user.updated',
            user: { ...a, image: 'a2.jpg', name: 'A2' },
          }),
        );
      });

      expect(result.current.groupChannelDisplayInfo.members).toContainEqual(
        expect.objectContaining({ imageUrl: 'a2.jpg', userName: 'A2' }),
      );
    });

    it('keeps overrideImage when a member is updated', async () => {
      const other = generateUser({ id: 'other', image: 'before.jpg' });
      const { channel, client } = await getClientAndChannel({
        members: [generateMember({ user: clientUser }), generateMember({ user: other })],
      });
      const { result } = renderHook(
        () => useChannelPreviewInfo({ channel, overrideImage: 'https://override.jpg' }),
        { wrapper: createWrapper(client) },
      );

      act(() => {
        client.dispatchEvent(
          fromPartial<Event>({
            type: 'user.updated',
            user: { ...other, image: 'after.jpg' },
          }),
        );
      });

      expect(result.current.displayImage).toBe('https://override.jpg');
    });

    it('follows channel.data, e.g. after channel.updated', async () => {
      const { channel, client } = await getClientAndChannel({
        channel: { custom: { image: 'https://before.jpg' } },
      });
      const { result } = renderHook(() => useChannelPreviewInfo({ channel }), {
        wrapper: createWrapper(client),
      });

      act(() => {
        channel.data = { ...channel.data, custom: { image: 'https://after.jpg' } };
      });

      expect(result.current.displayImage).toBe('https://after.jpg');
    });
  });
});
