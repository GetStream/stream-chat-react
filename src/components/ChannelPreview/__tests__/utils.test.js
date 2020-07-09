import '@testing-library/jest-dom';
import { v4 as uuidv4 } from 'uuid';

import {
  useMockedApis,
  generateChannel,
  generateMessage,
  generateImageAttachment,
  getTestClientWithUser,
  getOrCreateChannelApi,
  generateMember,
  generateUser,
} from 'mock-builders';

import {
  getLatestMessagePreview,
  getDisplayTitle,
  getDisplayImage,
} from '../utils';

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
    const customMessage = generateMessage();
    const channelWithTextMessage = generateChannel({
      messages: [customMessage],
    });
    const channelWithDeletedMessage = generateChannel({
      messages: [generateMessage({ deleted_at: new Date() })],
    });
    const channelWithAttachmentMessage = generateChannel({
      messages: [
        generateMessage({
          text: undefined,
          attachments: [generateImageAttachment()],
        }),
      ],
    });

    it.each([
      ['Nothing yet...', 'channelWithEmptyMessage', channelWithEmptyMessage],
      [
        'Message deleted',
        'channelWithDeletedMessage',
        channelWithDeletedMessage,
      ],
      [
        '🏙 Attachment...',
        'channelWithAttachmentMessage',
        channelWithAttachmentMessage,
      ],
      [customMessage.text, 'channelWithTextMessage', channelWithTextMessage],
    ])('should return %s for %s', async (expectedValue, testCaseName, c) => {
      const t = (text) => text;
      const channel = await getQueriedChannelInstance(c);
      expect(getLatestMessagePreview(channel, t)).toBe(expectedValue);
    });
  });

  describe('getDisplayTitle', () => {
    it('should return channel name, if it exists', async () => {
      const name = uuidv4();
      const channel = await getQueriedChannelInstance(
        generateChannel({ channel: { name } }),
      );

      expect(getDisplayTitle(channel, chatClient.user)).toBe(name);
    });

    it('should return name of other member of conversation if only 2 members and channel name doesnot exist', async () => {
      const otherUser = generateUser();
      const channel = await getQueriedChannelInstance(
        generateChannel({
          members: [
            generateMember({ user: otherUser }),
            generateMember({ user: clientUser }),
          ],
        }),
      );
      expect(getDisplayTitle(channel, chatClient.user)).toBe(otherUser.name);
    });
  });

  describe('getDisplayImage', () => {
    it('should return channel image, if it exists', async () => {
      const image = uuidv4();
      const channel = await getQueriedChannelInstance(
        generateChannel({ channel: { image } }),
      );

      expect(getDisplayImage(channel, chatClient.user)).toBe(image);
    });

    it('should return picture of other member of conversation if only 2 members and channel name doesnot exist', async () => {
      const otherUser = generateUser();
      const channel = await getQueriedChannelInstance(
        generateChannel({
          members: [
            generateMember({ user: otherUser }),
            generateMember({ user: clientUser }),
          ],
        }),
      );
      expect(getDisplayImage(channel, chatClient.user)).toBe(otherUser.image);
    });
  });
});
