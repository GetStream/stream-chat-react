import React from 'react';
import ReactMarkdown from 'react-markdown';
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

import type { StreamChat } from 'stream-chat';
import type { TranslationContextValue } from '../../../context';
import {
  getChannelDisplayImage,
  getGroupChannelDisplayInfo,
  getLatestMessagePreview,
} from '../utils';
import { generateStaticLocationResponse } from '../../../mock-builders';
import { render } from '@testing-library/react';

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

  describe('getLatestMessagePreview', () => {
    const channelWithEmptyMessage = generateChannel();
    const channelWithDeletedMessage = generateChannel({
      messages: [generateMessage({ deleted_at: new Date().toISOString() })],
    });
    const channelWithLocationMessage = generateChannel({
      messages: [
        generateMessage({
          attachments: [],
          shared_location: generateStaticLocationResponse({}),
          text: '',
        }),
      ],
    });
    const channelWithAttachmentMessage = generateChannel({
      messages: [
        generateMessage({
          attachments: [generateImageAttachment({})],
          text: undefined,
        }),
      ],
    });
    const channelWithHTMLInMessage = generateChannel({
      messages: [
        generateMessage({
          attachments: [generateImageAttachment({})],
          text:
            '<h1>Hello, world!</h1> \n' +
            '<p>This is my first web page.</p> \n' +
            '<p>It contains a <strong>main heading</strong> and <em> paragraph </em>.</p>',
        }),
      ],
    });

    const expectedTextWithHTMLRendering =
      '<h1>Hello, world!</h1> <p>This is my first web page.</p> <p>It contains a <strong>main heading</strong> and <em> paragraph </em>.</p>';

    function isReactMarkdownElement(x) {
      return React.isValidElement(x) && x.type === ReactMarkdown;
    }

    it.each([
      ['Nothing yet...', 'channelWithEmptyMessage', channelWithEmptyMessage],
      ['Message deleted', 'channelWithDeletedMessage', channelWithDeletedMessage],
      ['🏙 Attachment...', 'channelWithAttachmentMessage', channelWithAttachmentMessage],
      ['📍Shared location', 'channelWithLocationMessage', channelWithLocationMessage],
      [
        expectedTextWithHTMLRendering,
        'channelWithHTMLInMessage',
        channelWithHTMLInMessage,
      ],
    ])('should return %s for %s', async (expectedValue, testCaseName, c) => {
      const t = ((text: string) => text) as TranslationContextValue['t'];
      const channel = await getQueriedChannelInstance(c);
      const preview = getLatestMessagePreview(channel, t);
      if (isReactMarkdownElement(preview)) {
        const { container } = render(preview);
        expect(container).toHaveTextContent(expectedValue);
      } else {
        expect(getLatestMessagePreview(channel, t)).toBe(expectedValue);
      }
    });
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
