import '@testing-library/jest-dom';
import { nanoid } from 'nanoid';

import {
  generateChannel,
  generateImageAttachment,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from 'mock-builders';

import { getDisplayImage, getDisplayTitle, getLatestMessagePreview } from '../utils';

describe('ChannelPreview utils', () => {
  const clientUser = generateUser();
  let chatClient;
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

  describe('getLatestMessagePreview', () => {
    const channelWithEmptyMessage = generateChannel();
    const channelWithDeletedMessage = generateChannel({
      messages: [generateMessage({ deleted_at: new Date() })],
    });
    const channelWithAttachmentMessage = generateChannel({
      messages: [
        generateMessage({
          attachments: [generateImageAttachment()],
          text: undefined,
        }),
      ],
    });

    it.each([
      ['Nothing yet...', 'channelWithEmptyMessage', channelWithEmptyMessage],
      ['Message deleted', 'channelWithDeletedMessage', channelWithDeletedMessage],
      ['🏙 Attachment...', 'channelWithAttachmentMessage', channelWithAttachmentMessage],
    ])('should return %s for %s', async (expectedValue, testCaseName, c) => {
      const t = (text) => text;
      const channel = await getQueriedChannelInstance(c);
      expect(getLatestMessagePreview(channel, t)).toBe(expectedValue);
    });
  });

  describe('getDisplayTitle', () => {
    it('should return channel name, if it exists', async () => {
      const name = nanoid();
      const channel = await getQueriedChannelInstance(generateChannel({ channel: { name } }));

      expect(getDisplayTitle(channel, chatClient.user)).toBe(name);
    });

    it('should return name of other member of conversation if only 2 members and channel name doesnot exist', async () => {
      const otherUser = generateUser();
      const channel = await getQueriedChannelInstance(
        generateChannel({
          members: [generateMember({ user: otherUser }), generateMember({ user: clientUser })],
        }),
      );
      expect(getDisplayTitle(channel, chatClient.user)).toBe(otherUser.name);
    });
  });

  describe('getDisplayImage', () => {
    it('should return channel image, if it exists', async () => {
      const image = nanoid();
      const channel = await getQueriedChannelInstance(generateChannel({ channel: { image } }));

      expect(getDisplayImage(channel, chatClient.user)).toBe(image);
    });

    it('should return picture of other member of conversation if only 2 members and channel name doesnot exist', async () => {
      const otherUser = generateUser();
      const channel = await getQueriedChannelInstance(
        generateChannel({
          members: [generateMember({ user: otherUser }), generateMember({ user: clientUser })],
        }),
      );
      expect(getDisplayImage(channel, chatClient.user)).toBe(otherUser.image);
    });
  });
});
