import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import React from 'react';
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
} from '../../../mock-builders';

import { Attachment } from '../../Attachment';
import { defaultReactionOptions } from '../../Reactions';
import { Message } from '../Message';
import { MessageSimple } from '../MessageSimple';
import { MessageText } from '../MessageText';

expect.extend(toHaveNoViolations);

jest.mock('../../MessageActions', () => ({
  MessageActions: jest.fn(() => <div data-testid='mocked-message-actions' />),
}));

const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });
const onMentionsHoverMock = jest.fn();
const onMentionsClickMock = jest.fn();
const defaultProps = {
  initialMessage: false,
  message: generateMessage(),
  threadList: false,
};

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
  const channel = generateChannel({
    getConfig: () => channelConfigOverrides,
    state: { membership: {} },
  });
  const channelCapabilities = { 'send-reaction': true, ...channelCapabilitiesOverrides };
  const channelConfig = channel.getConfig();
  const customDateTimeParser = jest.fn(() => ({ format: jest.fn() }));

  return render(
    <ChatProvider value={{ client }}>
      <ChannelStateProvider value={{ channel, channelCapabilities, channelConfig }}>
        <ChannelActionProvider
          value={{
            onMentionsClick: onMentionsClickMock,
            onMentionsHover: onMentionsHoverMock,
          }}
        >
          <TranslationProvider
            value={{
              t: (key) => key,
              tDateTimeParser: customDateTimeParser,
              userLanguage: 'en',
            }}
          >
            <ComponentProvider
              value={{
                Attachment,

                Message: () => <MessageSimple channelConfig={channelConfig} />,
                reactionOptions: defaultReactionOptions,
              }}
            >
              <DialogManagerProvider id='message-dialog-manager-provider'>
                <Message {...defaultProps} {...customProps}>
                  <MessageText {...defaultProps} {...customProps} />
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
  beforeEach(jest.clearAllMocks);
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
      'str-chat__message-simple-text-inner--has-attachment',
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
      'str-chat__message-simple-text-inner--is-emoji',
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

  it('should inform that message was not sent when message is has type "error"', async () => {
    const message = generateAliceMessage({ type: 'error' });
    const { container, getByText } = await renderMessageText({
      customProps: { message },
    });
    expect(getByText('Error · Unsent')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should inform that retry is possible when message has status "failed"', async () => {
    const message = generateAliceMessage({ status: 'failed' });
    const { container, getByText } = await renderMessageText({
      customProps: { message },
    });
    expect(getByText('Message Failed · Click to try again')).toBeInTheDocument();
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

    let container;
    await act(async () => {
      const result = await renderMessageText({ customProps: { message } });
      container = result.container;
    });

    await waitFor(() => expect(screen.getByTestId('reaction-list')).toBeInTheDocument());
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
    const { container, queryByTestId } = await renderMessageText({
      channelCapabilitiesOverrides: { 'send-reaction': false },
      customProps: { message },
    });

    expect(queryByTestId('reaction-list')).toBeInTheDocument();
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
