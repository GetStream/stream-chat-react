import React from 'react';
import ReactMarkdown from 'react-markdown';
import { nanoid } from 'nanoid';

import {
  generateChannel,
  generateImageAttachment,
  generateMember,
  generateMessage,
  generateScrapedDataAttachment,
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
  getLatestMessagePreviewText,
} from '../utils';
import { composeChannelListItemAccessibleLabel } from '../utils.a11y';
import { MessageDeliveryStatus } from '../hooks/useMessageDeliveryStatus';
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
    const channelWithDeletedTypeMessage = generateChannel({
      messages: [generateMessage({ type: 'deleted' })],
    });
    const channelWithDeletedForMeMessage = generateChannel({
      messages: [generateMessage({ deleted_for_me: true })],
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
      ['Message deleted', 'channelWithDeletedTypeMessage', channelWithDeletedTypeMessage],
      [
        'Message deleted',
        'channelWithDeletedForMeMessage',
        channelWithDeletedForMeMessage,
      ],
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

  describe('getLatestMessagePreviewText', () => {
    it('returns a plain string for a deleted message', async () => {
      const t = ((text: string) => text) as TranslationContextValue['t'];
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [generateMessage({ deleted_at: new Date().toISOString() })],
        }),
      );
      expect(getLatestMessagePreviewText(channel, t)).toBe('Message deleted');
    });

    it('returns the raw message text (no markdown element) for a text message', async () => {
      const t = ((text: string) => text) as TranslationContextValue['t'];
      const channel = await getQueriedChannelInstance(
        generateChannel({ messages: [generateMessage({ text: 'hey there' })] }),
      );
      expect(getLatestMessagePreviewText(channel, t)).toBe('hey there');
    });

    it('strips markdown syntax so the announced text reads as words', async () => {
      const t = ((text: string) => text) as TranslationContextValue['t'];
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [
            generateMessage({ text: '**bold** and _em_ and [link](https://x.test)' }),
          ],
        }),
      );
      expect(getLatestMessagePreviewText(channel, t)).toBe('bold and em and link');
    });

    it('returns AI-generated text verbatim (not stripped), matching the display path', async () => {
      const t = ((text: string) => text) as TranslationContextValue['t'];
      const channel = await getQueriedChannelInstance(
        generateChannel({ messages: [generateMessage({ text: '**keep me**' })] }),
      );
      expect(getLatestMessagePreviewText(channel, t, 'en', () => true)).toBe(
        '**keep me**',
      );
    });

    // Non-text previews get a concise, announcement-specific phrasing (distinct from the visible
    // preview). t here interpolates and drops the `aria/` prefix.
    const tAria = ((key: string, opts?: Record<string, unknown>) => {
      const interpolated = Object.entries(opts ?? {}).reduce(
        (value, [name, arg]) => value.replace(`{{ ${name} }}`, String(arg)),
        key,
      );
      return interpolated.startsWith('aria/')
        ? interpolated.replace('aria/', '')
        : interpolated;
    }) as TranslationContextValue['t'];

    it('announces a poll by its question', async () => {
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [generateMessage({ poll: { name: 'Lunch spot?' }, text: '' })],
        }),
      );
      expect(getLatestMessagePreviewText(channel, tAria)).toBe('Poll: Lunch spot?');
    });

    it('announces an attachment-only message with a localized type label', async () => {
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [
            generateMessage({ attachments: [generateImageAttachment({})], text: '' }),
          ],
        }),
      );
      // 'image' maps to the localized 'aria/image' label (here the mock yields "image").
      expect(getLatestMessagePreviewText(channel, tAria)).toBe('Attachment image');
    });

    it('announces multiple attachments generically (not the first type)', async () => {
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [
            generateMessage({
              attachments: [generateImageAttachment({}), generateImageAttachment({})],
              text: '',
            }),
          ],
        }),
      );
      expect(getLatestMessagePreviewText(channel, tAria)).toBe(
        'Message with attachments',
      );
    });

    it('maps a voice recording attachment to its localized label', async () => {
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [
            generateMessage({ attachments: [{ type: 'voiceRecording' }], text: '' }),
          ],
        }),
      );
      expect(getLatestMessagePreviewText(channel, tAria)).toBe(
        'Attachment voice message',
      );
    });

    it('falls back to a generic "Attachment" for an unknown attachment type', async () => {
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [
            generateMessage({ attachments: [{ type: 'custom-widget' }], text: '' }),
          ],
        }),
      );
      expect(getLatestMessagePreviewText(channel, tAria)).toBe('Attachment');
    });

    it('announces a shared location plainly', async () => {
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [
            generateMessage({
              attachments: [],
              shared_location: generateStaticLocationResponse({}),
              text: '',
            }),
          ],
        }),
      );
      expect(getLatestMessagePreviewText(channel, tAria)).toBe('Shared location');
    });
  });

  describe('composeChannelListItemAccessibleLabel', () => {
    // t mirrors the natural-language fallback: interpolate {{ name }} and drop the `aria/` prefix.
    const t = ((key: string, opts?: Record<string, unknown>) => {
      const interpolated = Object.entries(opts ?? {}).reduce(
        (value, [name, arg]) => value.replace(`{{ ${name} }}`, String(arg)),
        key,
      );
      return interpolated.startsWith('aria/')
        ? interpolated.replace('aria/', '')
        : interpolated;
    }) as TranslationContextValue['t'];
    const tDateTimeParser = (() =>
      'recently') as unknown as TranslationContextValue['tDateTimeParser'];

    it('composes name, unread, sender + preview, and time in reading order', async () => {
      const alice = generateUser({ id: 'alice', name: 'Alice' });
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [generateMessage({ text: 'hey there', user: alice })],
        }),
      );

      const label = composeChannelListItemAccessibleLabel({
        channel,
        client: chatClient,
        displayTitle: 'Team chat',
        t,
        tDateTimeParser,
        unreadCount: 3,
      });

      expect(label).toBe(
        'Team chat. 3 unread message. Last message from Alice: hey there. Last activity: recently',
      );
    });

    it('announces the active state right after the name', async () => {
      const channel = await getQueriedChannelInstance(generateChannel());

      const label = composeChannelListItemAccessibleLabel({
        active: true,
        channel,
        client: chatClient,
        displayTitle: 'Team chat',
        t,
        tDateTimeParser,
      });

      expect(label.startsWith('Team chat. Active')).toBe(true);
    });

    it('omits the active state when not active', async () => {
      const channel = await getQueriedChannelInstance(generateChannel());

      const label = composeChannelListItemAccessibleLabel({
        channel,
        client: chatClient,
        displayTitle: 'Team chat',
        t,
        tDateTimeParser,
      });

      expect(label).not.toContain('Active');
    });

    it('announces an empty channel has no messages', async () => {
      const channel = await getQueriedChannelInstance(generateChannel());

      const label = composeChannelListItemAccessibleLabel({
        channel,
        client: chatClient,
        displayTitle: 'Empty room',
        t,
        tDateTimeParser,
      });

      expect(label).toBe('Empty room. There are no messages in this chat.');
    });

    it('labels an own latest message with "You" and includes the delivery status', async () => {
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [generateMessage({ text: 'on my way', user: clientUser })],
        }),
      );

      const label = composeChannelListItemAccessibleLabel({
        channel,
        client: chatClient,
        displayTitle: 'Team chat',
        messageDeliveryStatus: MessageDeliveryStatus.READ,
        t,
        tDateTimeParser,
      });

      expect(label).toContain('Last message from You: on my way');
      expect(label).toContain('Delivery status: Read');
      // No unread segment when unread is omitted/zero.
      expect(label).not.toContain('unread');
    });

    it('honors a config: custom order, an overridden part, and a separator', async () => {
      const alice = generateUser({ id: 'alice', name: 'Alice' });
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [generateMessage({ text: 'hey there', user: alice })],
        }),
      );

      const label = composeChannelListItemAccessibleLabel(
        {
          channel,
          client: chatClient,
          displayTitle: 'Team chat',
          t,
          tDateTimeParser,
          unreadCount: 3,
        },
        {
          order: ['name', 'unreadCount'],
          parts: {
            unreadCount: ({ unreadCount }) =>
              unreadCount ? `${unreadCount} new` : undefined,
          },
          separator: ' — ',
        },
      );

      expect(label).toBe('Team chat — 3 new');
    });

    it('honors a full build override', async () => {
      const channel = await getQueriedChannelInstance(generateChannel());

      const label = composeChannelListItemAccessibleLabel(
        { channel, client: chatClient, displayTitle: 'Team chat', t, tDateTimeParser },
        { build: ({ displayTitle }) => `Channel ${displayTitle}` },
      );

      expect(label).toBe('Channel Team chat');
    });

    it('omits the sender (no raw user id) when the last message author has no name', async () => {
      const anon = generateUser({ id: 'anon-123', name: undefined });
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [generateMessage({ text: 'hi there', user: anon })],
        }),
      );

      const label = composeChannelListItemAccessibleLabel({
        channel,
        client: chatClient,
        displayTitle: 'Team chat',
        t,
        tDateTimeParser,
      });

      expect(label).toContain('Last message: hi there');
      expect(label).not.toContain('anon-123');
    });

    it('announces the attachment count alongside the last message text', async () => {
      const alice = generateUser({ id: 'alice', name: 'Alice' });
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [
            generateMessage({
              attachments: [generateImageAttachment({}), generateImageAttachment({})],
              text: 'look at these',
              user: alice,
            }),
          ],
        }),
      );

      const label = composeChannelListItemAccessibleLabel({
        channel,
        client: chatClient,
        displayTitle: 'Team chat',
        t,
        tDateTimeParser,
      });

      expect(label).toContain('Last message from Alice: look at these');
      // mock t does not pluralize, so it yields the base "{{ count }} attachment" → "2 attachment"
      expect(label).toContain('2 attachment');
    });

    it('announces multiple attachments (no text) generically plus the count', async () => {
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [
            generateMessage({
              attachments: [generateImageAttachment({}), generateImageAttachment({})],
              text: '',
            }),
          ],
        }),
      );

      const label = composeChannelListItemAccessibleLabel({
        channel,
        client: chatClient,
        displayTitle: 'Team chat',
        t,
        tDateTimeParser,
      });

      expect(label).toContain('Message with attachments');
      expect(label).toContain('2 attachment');
      // not the misleading single type
      expect(label).not.toContain('Attachment image');
    });

    it('does not announce a redundant count for a single attachment with no text', async () => {
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [
            generateMessage({ attachments: [generateImageAttachment({})], text: '' }),
          ],
        }),
      );

      const label = composeChannelListItemAccessibleLabel({
        channel,
        client: chatClient,
        displayTitle: 'Team chat',
        t,
        tDateTimeParser,
      });

      // the single attachment is conveyed by the lastMessage part ("Attachment image"); no count
      expect(label).toContain('Attachment image');
      expect(label).not.toContain('1 attachment');
    });

    it('does not count a link preview as an attachment', async () => {
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [
            generateMessage({
              attachments: [generateScrapedDataAttachment({ title: 'Example Domain' })],
              text: 'https://example.com',
            }),
          ],
        }),
      );

      const label = composeChannelListItemAccessibleLabel({
        channel,
        client: chatClient,
        displayTitle: 'Team chat',
        t,
        tDateTimeParser,
      });

      expect(label).toContain('Shared a link with title: Example Domain');
      expect(label).not.toContain('attachment');
    });

    it('announces a link preview alongside the last message text', async () => {
      const alice = generateUser({ id: 'alice', name: 'Alice' });
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [
            generateMessage({
              attachments: [generateScrapedDataAttachment({ title: 'Example Domain' })],
              // a pasted link keeps the URL as the message text
              text: 'https://example.com',
              user: alice,
            }),
          ],
        }),
      );

      const label = composeChannelListItemAccessibleLabel({
        channel,
        client: chatClient,
        displayTitle: 'Team chat',
        t,
        tDateTimeParser,
      });

      // The message text AND the link are both announced (link as its own segment after it).
      expect(label).toContain('Last message from Alice: https://example.com');
      expect(label).toContain('Shared a link with title: Example Domain');
    });

    it('announces a link preview without a title generically', async () => {
      const channel = await getQueriedChannelInstance(
        generateChannel({
          messages: [
            generateMessage({
              attachments: [generateScrapedDataAttachment({ title: undefined })],
              text: 'https://example.com',
            }),
          ],
        }),
      );

      const label = composeChannelListItemAccessibleLabel({
        channel,
        client: chatClient,
        displayTitle: 'Team chat',
        t,
        tDateTimeParser,
      });

      expect(label).toContain('Shared a link');
      expect(label).not.toContain('Shared a link:');
    });

    it('exposes latestMessage to parts', async () => {
      const bob = generateUser({ id: 'bob', name: 'Bob' });
      const channel = await getQueriedChannelInstance(
        generateChannel({ messages: [generateMessage({ text: 'x', user: bob })] }),
      );
      const latestMessage =
        channel.state.latestMessages[channel.state.latestMessages.length - 1];

      const label = composeChannelListItemAccessibleLabel(
        {
          channel,
          client: chatClient,
          displayTitle: 'C',
          latestMessage,
          t,
          tDateTimeParser,
        },
        {
          order: ['sender'],
          parts: { sender: ({ latestMessage }) => latestMessage?.user?.name },
        },
      );

      expect(label).toBe('Bob');
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
