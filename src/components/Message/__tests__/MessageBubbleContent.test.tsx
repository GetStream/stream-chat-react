import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel as ChannelType, LocalMessage, StreamChat } from 'stream-chat';

import { axe } from '../../../../axe-helper';
import {
  generateImageAttachment,
  generateMessage,
  generatePoll,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { WithComponents } from '../../../context';
import { Message } from '../Message';
import {
  MessageBubbleContent,
  type MessageBubbleContentSetItem,
} from '../MessageBubbleContent';
import { defaultMessageBubbleContentSet } from '../MessageBubbleContent.defaults';
import type { MessageProps } from '../types';
import type { MessageTextProps } from '../MessageText';

const user = generateUser({ id: 'me' });

const CONTENT_SELECTORS: Record<string, string> = {
  attachments: '.str-chat__attachment-list',
  custom: '[data-testid="custom-content"]',
  poll: '.str-chat__poll',
  quotedMessage: '.str-chat__quoted-message-preview',
  text: '.str-chat__message-text',
};

/** The bubble's content types, in DOM order. */
const bubbleContentOrder = (container: HTMLElement) => {
  const bubble = container.querySelector('.str-chat__message-bubble');
  if (!bubble) return [];
  return Array.from(bubble.children).flatMap((child) => {
    const type = Object.entries(CONTENT_SELECTORS).find(([, selector]) =>
      child.matches(selector),
    )?.[0];
    return type ? [type] : [];
  });
};

const setup = async () => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({ customUser: user });
  const poll = generatePoll({ id: 'bubble-poll', name: 'Which venue?' });
  client.polls.hydratePollCache([fromPartial({ poll })]);
  const quoted = generateMessage({ text: 'the quoted one', user });
  const message = generateMessage({
    attachments: [generateImageAttachment()],
    poll,
    poll_id: poll.id,
    quoted_message: quoted,
    quoted_message_id: quoted.id,
    text: 'please vote',
    user,
  }) as unknown as LocalMessage;
  return { channel, client, message };
};

const renderMessage = async ({
  channel,
  client,
  components = {},
  isMessageAIGenerated,
  message,
}: {
  channel: ChannelType;
  client: StreamChat;
  components?: Parameters<typeof WithComponents>[0]['overrides'];
  isMessageAIGenerated?: (message: LocalMessage) => boolean;
  message: LocalMessage;
}) => {
  let result!: ReturnType<typeof render>;
  await act(() => {
    result = render(
      <Chat client={client} isMessageAIGenerated={isMessageAIGenerated}>
        <Channel channel={channel}>
          <WithComponents overrides={components}>
            <Message {...fromPartial<MessageProps>({ message })} />
          </WithComponents>
        </Channel>
      </Chat>,
    );
  });
  return result;
};

describe('MessageBubbleContent', () => {
  afterEach(cleanup);

  it('renders a poll next to the quoted message, attachments and text, quote first', async () => {
    const { container } = await renderMessage(await setup());

    expect(bubbleContentOrder(container)).toEqual([
      'quotedMessage',
      'poll',
      'attachments',
      'text',
    ]);
  });

  it('marks the message as having a poll, and not as a single-attachment message', async () => {
    const { container } = await renderMessage(await setup());
    const root = container.querySelector('.str-chat__message');

    expect(root).toHaveClass('str-chat__message--has-poll');
    expect(root).not.toHaveClass('str-chat__message--has-single-attachment');
  });

  it('skips content the message does not have', async () => {
    const { channel, client } = await setup();
    const message = generateMessage({
      text: 'just text',
      user,
    }) as unknown as LocalMessage;
    const { container } = await renderMessage({ channel, client, message });

    expect(bubbleContentOrder(container)).toEqual(['text']);
  });

  it('renders a reordered and extended set installed through the component slot', async () => {
    const setupResult = await setup();
    const byType = (type: string) =>
      defaultMessageBubbleContentSet.find(
        (item) => item.type === type,
      ) as MessageBubbleContentSetItem;
    const CustomContent = () => <div data-testid='custom-content'>Custom</div>;
    const CustomBubbleContent = () => (
      <MessageBubbleContent
        messageBubbleContentSet={[
          byType('text'),
          { Component: CustomContent, isVisible: () => true, type: 'custom' },
          byType('poll'),
        ]}
      />
    );

    const { container } = await renderMessage({
      ...setupResult,
      components: { MessageBubbleContent: CustomBubbleContent },
    });

    expect(bubbleContentOrder(container)).toEqual(['text', 'custom', 'poll']);
  });

  it('renders the text through the MessageText override', async () => {
    const { channel, client } = await setup();
    const message = generateMessage({
      text: 'just text',
      user,
    }) as unknown as LocalMessage;
    const MessageText = vi.fn(({ message }: MessageTextProps) => (
      <div data-testid='custom-message-text'>{message?.text}</div>
    ));

    const { getByTestId } = await renderMessage({
      channel,
      client,
      components: { MessageText },
      message,
    });

    expect(getByTestId('custom-message-text')).toHaveTextContent('just text');
    expect(MessageText).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.objectContaining({ id: message.id }) }),
      undefined,
    );
  });

  it('renders the text of an AI-generated message through the MessageText override', async () => {
    const { channel, client } = await setup();
    const message = generateMessage({
      text: 'generated',
      user,
    }) as unknown as LocalMessage;
    const MessageText = ({ message }: MessageTextProps) => (
      <div data-testid='custom-message-text'>{message?.text}</div>
    );
    const isMessageAIGenerated = vi.fn(() => true);

    const { getByTestId } = await renderMessage({
      channel,
      client,
      components: { MessageText },
      isMessageAIGenerated,
      message,
    });

    expect(isMessageAIGenerated).toHaveBeenCalledWith(
      expect.objectContaining({ id: message.id }),
    );
    expect(getByTestId('custom-message-text')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = await renderMessage(await setup());

    expect(await axe(container)).toHaveNoViolations();
  });
});
