import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { fromPartial } from '@total-typescript/shoehorn';
import { axe } from '../../../../axe-helper';

import {
  ChannelActionProvider,
  ChannelStateProvider,
  ChatProvider,
  ComponentProvider,
  DialogManagerProvider,
  TranslationProvider,
} from '../../../context';
import {
  countReactions,
  generateChannel,
  generateMessage,
  generateReaction,
  generateUser,
  getTestClientWithUser,
  groupReactions,
  mockChannelActionContext,
  mockChannelStateContext,
  mockChatContext,
  mockComponentContext,
  mockTranslationContextValue,
} from '../../../mock-builders';

import { Attachment } from '../../Attachment';
import { defaultReactionOptions } from '../../Reactions';
import { Message } from '../Message';
import { MessageUI } from '../MessageUI';
import { MessageText } from '../MessageText';
import type { MessageProps } from '../types';
import type { MessageTextProps } from '../MessageText';
import type { TranslationContextValue } from '../../../context';

vi.mock('../../ChatView', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ChatView')>();
  return {
    ...actual,
    useChatViewContext: vi.fn(() => ({
      activeChatView: 'channels',
      setActiveChatView: vi.fn(),
    })),
    useThreadsViewContext: vi.fn(() => ({
      activeThread: undefined,
      setActiveThread: vi.fn(),
    })),
  };
});

vi.mock('../../MessageActions', () => ({
  MessageActions: vi.fn(() => <div data-testid='mocked-message-actions' />),
}));

const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });
const onMentionsHoverMock = vi.fn();
const onMentionsClickMock = vi.fn();
const defaultProps = {
  initialMessage: false,
  message: generateMessage(),
  threadList: false,
};

const translate = (key: string, options?: Record<string, string>) =>
  key.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, token: string) => options?.[token] ?? '');

function generateAliceMessage(messageOptions) {
  return generateMessage({
    user: alice,
    ...messageOptions,
  });
}

async function renderMessageText({
  channelCapabilitiesOverrides = {},
  channelConfigOverrides = {},
  customProps = {},
} = {}) {
  const client = await getTestClientWithUser(alice);
  const channel = generateChannel(
    fromPartial<Parameters<typeof generateChannel>[0]>({
      getConfig: () => channelConfigOverrides,
      state: { membership: {} },
    }),
  );
  const channelCapabilities = { 'send-reaction': true, ...channelCapabilitiesOverrides };
  const channelConfig = channel['getConfig']();
  const customDateTimeParser = vi.fn(() => ({ format: vi.fn() }));

  return render(
    <ChatProvider value={mockChatContext({ client })}>
      <ChannelStateProvider
        value={mockChannelStateContext({ channel, channelCapabilities, channelConfig })}
      >
        <ChannelActionProvider
          value={mockChannelActionContext({
            onMentionsClick: onMentionsClickMock,
            onMentionsHover: onMentionsHoverMock,
          })}
        >
          <TranslationProvider
            value={mockTranslationContextValue({
              t: ((key: string, options?: Record<string, string>) =>
                translate(key, options)) as TranslationContextValue['t'],
              tDateTimeParser:
                customDateTimeParser as TranslationContextValue['tDateTimeParser'],
              userLanguage: 'en',
            })}
          >
            <ComponentProvider
              value={mockComponentContext({
                Attachment,

                Message: () => <MessageUI />,
                reactionOptions: defaultReactionOptions,
              })}
            >
              <DialogManagerProvider id='message-dialog-manager-provider'>
                <Message {...(defaultProps as MessageProps)} {...customProps}>
                  <MessageText {...(defaultProps as MessageTextProps)} {...customProps} />
                </Message>
              </DialogManagerProvider>
            </ComponentProvider>
          </TranslationProvider>
        </ChannelActionProvider>
      </ChannelStateProvider>
    </ChatProvider>,
  );
}

const messageTextTestId = 'message-text-inner-wrapper';

describe('<MessageText />', () => {
  beforeEach(vi.clearAllMocks);
  it('should not render anything if message is not set', async () => {
    const { container, queryByTestId } = await renderMessageText({
      customProps: { message: {} },
    });
    expect(queryByTestId(messageTextTestId)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not render anything if message text is not set', async () => {
    const { container, queryByTestId } = await renderMessageText({
      customProps: { message: {} },
    });
    expect(queryByTestId(messageTextTestId)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should set attachments css class modifier when message has text and is focused', async () => {
    const attachment = {
      image_url: 'http://image.jpg',
      type: 'image',
    };
    const message = generateAliceMessage({
      attachments: [attachment, attachment, attachment],
    });
    const { container, getByTestId } = await renderMessageText({
      customProps: { message },
    });
    expect(getByTestId(messageTextTestId)).toHaveClass(
      'str-chat__message-text-inner--has-attachment',
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should set emoji css class when message has text that is only emojis', async () => {
    const message = generateAliceMessage({ text: '🤖🤖🤖🤖' });
    const { container, getByTestId } = await renderMessageText({
      customProps: { message },
    });
    expect(getByTestId(messageTextTestId)).toHaveClass(
      'str-chat__message-text-inner--is-emoji',
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle message mention mouse hover event', async () => {
    const message = generateAliceMessage({ mentioned_users: [bob] });
    const { container, getByTestId } = await renderMessageText({
      customProps: {
        message,
        onMentionsHoverMessage: onMentionsHoverMock,
      },
    });
    expect(onMentionsHoverMock).not.toHaveBeenCalled();
    fireEvent.mouseOver(getByTestId(messageTextTestId));
    expect(onMentionsHoverMock).toHaveBeenCalledTimes(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should make only inner wrapper focusable when message has mentions', async () => {
    const message = generateAliceMessage({ mentioned_users: [bob] });
    const { container, getByTestId } = await renderMessageText({
      customProps: { message },
    });

    const innerWrapper = getByTestId(messageTextTestId);
    const outerWrapper = innerWrapper.parentElement;

    expect(outerWrapper).not.toHaveAttribute('tabindex');
    expect(innerWrapper).toHaveAttribute('tabindex', '0');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle message mention mouse click event', async () => {
    const message = generateAliceMessage({ mentioned_users: [bob] });
    const { container, getByTestId } = await renderMessageText({
      customProps: {
        message,
        onMentionsClickMessage: onMentionsClickMock,
      },
    });
    expect(onMentionsClickMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId(messageTextTestId));
    expect(onMentionsClickMock).toHaveBeenCalledTimes(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle message mention keyboard interaction with Enter and Space', async () => {
    const message = generateAliceMessage({ mentioned_users: [bob] });
    const { container, getByTestId } = await renderMessageText({
      customProps: { message },
    });

    expect(onMentionsClickMock).not.toHaveBeenCalled();
    fireEvent.keyDown(getByTestId(messageTextTestId), { key: 'Enter' });
    fireEvent.keyDown(getByTestId(messageTextTestId), { key: ' ' });
    fireEvent.keyDown(getByTestId(messageTextTestId), { key: 'Escape' });
    expect(onMentionsClickMock).toHaveBeenCalledTimes(2);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should keep only outer wrapper focusable when message has no mentions', async () => {
    const message = generateAliceMessage({ mentioned_users: [] });
    const { container, getByTestId } = await renderMessageText({
      customProps: { message },
    });

    const innerWrapper = getByTestId(messageTextTestId);
    const outerWrapper = innerWrapper.parentElement;

    expect(outerWrapper).toHaveAttribute('tabindex', '0');
    expect(innerWrapper).not.toHaveAttribute('tabindex');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should expose sender context on the focusable message wrapper', async () => {
    const text = 'Hello, world!';
    const message = generateAliceMessage({ text });
    const { getByTestId } = await renderMessageText({
      customProps: { message },
    });

    const focusableWrapper = getByTestId(messageTextTestId).parentElement;

    expect(focusableWrapper).toHaveAccessibleName(`aria/Message from alice, ${text}`);
  });

  it('should expose sender context on the mention-interactive text wrapper', async () => {
    const text = 'Hello @bob';
    const message = generateAliceMessage({ mentioned_users: [bob], text });
    const { getByTestId } = await renderMessageText({
      customProps: { message },
    });

    expect(getByTestId(messageTextTestId)).toHaveAccessibleName(
      `aria/Message from alice, ${text}`,
    );
  });

  it('should not expose message user id in the accessible name fallback', async () => {
    const text = 'Hello, world!';
    const message = generateMessage({
      text,
      user: generateUser({ id: 'alice-id', name: undefined }),
    });
    const { getByTestId } = await renderMessageText({
      customProps: { message },
    });

    const focusableWrapper = getByTestId(messageTextTestId).parentElement;

    expect(focusableWrapper).toHaveAccessibleName(`aria/Message, ${text}`);
  });

  it('should inform that message was not sent when message is has type "error"', async () => {
    const message = generateAliceMessage({ type: 'error' });
    const { container } = await renderMessageText({
      customProps: { message },
    });
    expect(
      container.querySelector('.str-chat__message-error-indicator'),
    ).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should inform that retry is possible when message has status "failed"', async () => {
    const message = generateAliceMessage({ status: 'failed' });
    const { container } = await renderMessageText({
      customProps: { message },
    });
    expect(container.querySelector('.str-chat__message--failed')).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__message-send-can-be-retried'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__message-error-indicator'),
    ).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('render message html when unsafe html property is enabled', async () => {
    const message = generateAliceMessage({
      html: '<span data-testid="custom-html" />',
    });
    const { container, getByTestId } = await renderMessageText({
      customProps: {
        message,
        unsafeHTML: true,
      },
    });
    expect(getByTestId('custom-html')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('render message text', async () => {
    const text = 'Hello, world!';
    const message = generateAliceMessage({ text });
    const { container, getByText } = await renderMessageText({
      customProps: { message },
    });
    expect(getByText(text)).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders built-in, role, and user-group mentions with mention styling', async () => {
    const text = 'Hello @channel @here @admin @backend-team';
    const message = generateAliceMessage({
      mentioned_channel: true,
      mentioned_group_ids: ['backend-team'],
      mentioned_here: true,
      mentioned_roles: ['admin'],
      text,
    });
    const { container, getByText } = await renderMessageText({
      customProps: { message },
    });

    expect(getByText('@channel')).toHaveAttribute('data-mention-type', 'channel');
    expect(getByText('@here')).toHaveAttribute('data-mention-type', 'here');
    expect(getByText('@admin')).toHaveAttribute('data-mention-type', 'role');
    expect(getByText('@backend-team')).toHaveAttribute('data-mention-type', 'user_group');
    expect(container.querySelectorAll('.str-chat__message-mention')).toHaveLength(4);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display text in users set language', async () => {
    const text = 'bonjour';
    const message = generateAliceMessage({
      i18n: { en_text: 'hello', fr_text: 'bonjour', language: 'fr' },
      text,
    });

    const { container, getByText } = await renderMessageText({
      customProps: { message },
    });

    expect(getByText('hello')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should show reaction list if message has reactions and detailed reactions are not displayed', async () => {
    const reactions = [generateReaction({ user: bob })];
    const message = generateAliceMessage({
      latest_reactions: reactions,
      reaction_counts: countReactions(reactions),
      reaction_groups: groupReactions(reactions),
    });

    let container: HTMLElement;
    await act(async () => {
      const result = await renderMessageText({ customProps: { message } });
      container = result.container;
    });

    await waitFor(() =>
      expect(container.querySelector('.str-chat__message-reactions')).toBeInTheDocument(),
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // FIXME: test relying on deprecated channel config parameter
  it('should show reaction list even though sending reactions is disabled in channelConfig', async () => {
    const reactions = [generateReaction({ user: bob })];
    const message = generateAliceMessage({
      latest_reactions: reactions,
      reaction_counts: countReactions(reactions),
      reaction_groups: groupReactions(reactions),
    });
    const { container } = await renderMessageText({
      channelCapabilitiesOverrides: { 'send-reaction': false },
      customProps: { message },
    });

    expect(container.querySelector('.str-chat__message-reactions')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message actions', async () => {
    const { container, getByTestId } = await renderMessageText();
    await waitFor(() =>
      expect(getByTestId('mocked-message-actions')).toBeInTheDocument(),
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render with a custom wrapper class when one is set', async () => {
    const customWrapperClass = 'custom-wrapper';
    const message = generateMessage({ text: 'hello world' });
    const { container } = await renderMessageText({
      customProps: { customWrapperClass, message },
    });
    expect(container).toMatchSnapshot();
  });

  it('should render with a custom inner class when one is set', async () => {
    const customInnerClass = 'custom-inner';
    const message = generateMessage({ text: 'hi mate' });
    const { container } = await renderMessageText({
      customProps: { customInnerClass, message },
    });
    expect(container).toMatchSnapshot();
  });

  it('should render with custom theme identifier in generated css classes when theme is set', async () => {
    const message = generateMessage({ text: 'whatup?!' });
    const { container } = await renderMessageText({
      customProps: { message, theme: 'custom' },
    });
    expect(container).toMatchSnapshot();
  });
});
