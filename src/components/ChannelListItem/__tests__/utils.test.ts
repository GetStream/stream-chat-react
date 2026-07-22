import { nanoid } from 'nanoid';

import {
  generateChannel,
  generateMember,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from 'mock-builders';

import type { StreamChat } from 'stream-chat';
import { getChannelDisplayImage, getGroupChannelDisplayInfo } from '../utils';

describe('ChannelPreview utils', () => {
  const clientUser = generateUser();
  let chatClient: StreamChat;
  const getQueriedChannelInstance = async (c) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMockedApis(chatClient, [getOrCreateChannelApi(c)]);

    const channel = chatClient.channel('messaging');

    await channel.watch();

    return channel;
  };

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
  });

  describe('getChannelDisplayImage (utils)', () => {
    it('returns channel.data.image when set', async () => {
      const image = nanoid();
      const channel = await getQueriedChannelInstance(
        generateChannel({ channel: { image } }),
      );
      expect(getChannelDisplayImage(channel)).toBe(image);
    });

    it('returns other member user.image for DM (2 members) when channel has no image', async () => {
      const otherUser = generateUser({ image: 'https://other-avatar.jpg' });
      const channel = await getQueriedChannelInstance(
        generateChannel({
          members: [
            generateMember({ user: otherUser }),
            generateMember({ user: clientUser }),
          ],
        }),
      );
      expect(getChannelDisplayImage(channel)).toBe('https://other-avatar.jpg');
    });

    it('returns undefined for DM when other member has no image', async () => {
      const otherUser = generateUser({ image: undefined });
      const channel = await getQueriedChannelInstance(
        generateChannel({
          members: [
            generateMember({ user: otherUser }),
            generateMember({ user: clientUser }),
          ],
        }),
      );
      expect(getChannelDisplayImage(channel)).toBeUndefined();
    });
  });

  describe('getGroupChannelDisplayInfo (utils)', () => {
    it('returns undefined for 2 or fewer members', async () => {
      const channel = await getQueriedChannelInstance(
        generateChannel({
          members: [
            generateMember({ user: generateUser() }),
            generateMember({ user: clientUser }),
          ],
        }),
      );
      expect(getGroupChannelDisplayInfo(channel)).toBeUndefined();
    });

    it('returns members and overflowCount for 3+ members', async () => {
      const channel = await getQueriedChannelInstance(
        generateChannel({
          members: [
            generateMember({ user: generateUser({ image: 'a.jpg', name: 'A' }) }),
            generateMember({ user: generateUser({ image: 'b.jpg', name: 'B' }) }),
            generateMember({ user: clientUser }),
          ],
        }),
      );
      const info = getGroupChannelDisplayInfo(channel);
      expect(info).toBeDefined();
      expect(info.members.length).toBeGreaterThanOrEqual(2);
      expect(info.members.every((m) => 'imageUrl' in m && 'userName' in m)).toBe(true);
    });
  });
});
