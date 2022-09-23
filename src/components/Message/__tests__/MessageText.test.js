/* eslint-disable jest-dom/prefer-to-have-class */
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import EmojiComponentMock from 'emoji-mart/dist-modern/components/emoji/nimble-emoji';
import { toHaveNoViolations } from 'jest-axe';
import React from 'react';
import testRenderer from 'react-test-renderer';
import { axe } from '../../../../axe-helper';

import {
  ChannelActionProvider,
  ChannelStateProvider,
  ChatProvider,
  ComponentProvider,
  EmojiProvider,
  TranslationProvider,
} from '../../../context';
import {
  emojiDataMock,
  generateChannel,
  generateMessage,
  generateReaction,
  generateUser,
  getTestClientWithUser,
} from '../../../mock-builders';

import { Attachment } from '../../Attachment';
import { Message } from '../Message';
import { MessageOptions as MessageOptionsMock } from '../MessageOptions';
import { MessageSimple } from '../MessageSimple';
import { MessageText } from '../MessageText';

expect.extend(toHaveNoViolations);

jest.mock('../MessageOptions', () => ({
  MessageOptions: jest.fn(() => <div />),
}));

const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });
const onMentionsHoverMock = jest.fn();
const onMentionsClickMock = jest.fn();
const defaultProps = {
  initialMessage: false,
  message: generateMessage(),
  messageWrapperRef: { current: document.createElement('div') },
  onReactionListClick: () => {},
  threadList: false,
};

function generateAliceMessage(messageOptions) {
  return generateMessage({
    user: alice,
    ...messageOptions,
  });
}

async function renderMessageText(customProps, channelConfigOverrides = {}, renderer = render) {
  const client = await getTestClientWithUser(alice);
  const channel = generateChannel({
    getConfig: () => ({ reactions: true, ...channelConfigOverrides }),
    state: { membership: {} },
  });
  const channelCapabilities = { 'send-reaction': true };
  const channelConfig = channel.getConfig();
  const customDateTimeParser = jest.fn(() => ({ format: jest.fn() }));

  return renderer(
    <ChatProvider value={{ client }}>
      <ChannelStateProvider value={{ channel, channelCapabilities, channelConfig }}>
        <ChannelActionProvider
          value={{ onMentionsClick: onMentionsClickMock, onMentionsHover: onMentionsHoverMock }}
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
                Emoji: EmojiComponentMock,
                // eslint-disable-next-line react/display-name
                Message: () => <MessageSimple channelConfig={channelConfig} />,
              }}
            >
              <EmojiProvider value={{ emojiConfig: emojiDataMock }}>
                <Message {...defaultProps} {...customProps}>
                  <MessageText {...defaultProps} {...customProps} />
                </Message>
              </EmojiProvider>
            </ComponentProvider>
          </TranslationProvider>
        </ChannelActionProvider>
      </ChannelStateProvider>
    </ChatProvider>,
  );
}

const messageTextTestId = 'message-text-inner-wrapper';
const reactionSelectorTestId = 'reaction-selector';

describe('<MessageText />', () => {
  beforeEach(jest.clearAllMocks);
  it('should not render anything if message is not set', async () => {
    const { container, queryByTestId } = await renderMessageText({ message: {} });
    expect(queryByTestId(messageTextTestId)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not render anything if message text is not set', async () => {
    const { container, queryByTestId } = await renderMessageText({ message: {} });
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
    const { container, getByTestId } = await renderMessageText({ message });
    expect(getByTestId(messageTextTestId).className).toContain('--has-attachment');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should set emoji css class when message has text that is only emojis', async () => {
    const message = generateAliceMessage({ text: '🤖🤖🤖🤖' });
    const { container, getByTestId } = await renderMessageText({ message });
    expect(getByTestId(messageTextTestId).className).toContain('--is-emoji');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle message mention mouse hover event', async () => {
    const message = generateAliceMessage({ mentioned_users: [bob] });
    const { container, getByTestId } = await renderMessageText({
      message,
      onMentionsHoverMessage: onMentionsHoverMock,
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
      message,
      onMentionsClickMessage: onMentionsClickMock,
    });
    expect(onMentionsClickMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId(messageTextTestId));
    expect(onMentionsClickMock).toHaveBeenCalledTimes(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should inform that message was not sent when message is has type "error"', async () => {
    const message = generateAliceMessage({ type: 'error' });
    const { container, getByText } = await renderMessageText({ message });
    expect(getByText('Error · Unsent')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should inform that retry is possible when message has status "failed"', async () => {
    const message = generateAliceMessage({ status: 'failed' });
    const { container, getByText } = await renderMessageText({ message });
    expect(getByText('Message Failed · Click to try again')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('render message html when unsafe html property is enabled', async () => {
    const message = generateAliceMessage({
      html: '<span data-testid="custom-html" />',
    });
    const { container, getByTestId } = await renderMessageText({
      message,
      unsafeHTML: true,
    });
    expect(getByTestId('custom-html')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('render message text', async () => {
    const text = 'Hello, world!';
    const message = generateAliceMessage({ text });
    const { container, getByText } = await renderMessageText({ message });
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

    const { container, getByText } = await renderMessageText({ message });

    expect(getByText('hello')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should show reaction list if message has reactions and detailed reactions are not displayed', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
    });

    let container;
    await act(async () => {
      const result = await renderMessageText({ message });
      container = result.container;
    });

    await waitFor(() => expect(screen.getByTestId('reaction-list')).toBeInTheDocument());
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not show reaction list if disabled in channelConfig', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
    });
    const { container, queryByTestId } = await renderMessageText({ message }, { reactions: false });

    expect(queryByTestId('reaction-list')).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should show reaction selector when message has reaction and reaction list is clicked', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
    });
    const { container, getByTestId, queryByTestId } = await renderMessageText({ message });
    expect(queryByTestId(reactionSelectorTestId)).not.toBeInTheDocument();
    await act(() => {
      fireEvent.click(getByTestId('reaction-list'));
    });

    expect(getByTestId(reactionSelectorTestId)).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message options', async () => {
    const { container } = await renderMessageText();
    expect(MessageOptionsMock).toHaveBeenCalledTimes(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message options with custom props when those are set', async () => {
    const displayLeft = false;
    const { container } = await renderMessageText({
      customOptionProps: {
        displayLeft,
      },
    });
    // eslint-disable-next-line jest/prefer-called-with
    expect(MessageOptionsMock).toHaveBeenCalled();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render with a custom wrapper class when one is set', async () => {
    const customWrapperClass = 'custom-wrapper';
    const message = generateMessage({ text: 'hello world' });
    const tree = await renderMessageText({ customWrapperClass, message }, {}, testRenderer.create);
    expect(tree.toJSON()).toMatchInlineSnapshot(`
      <div
        className="str-chat__message str-chat__message-simple str-chat__message--regular str-chat__message--received str-chat__message--other str-chat__message--has-text"
      >
        <div
          className="str-chat__message-inner"
          data-testid="message-inner"
        >
          <div />
          <div
            className="str-chat__message-reactions-host"
          />
          <div
            className="str-chat__message-bubble"
          >
            <div
              className="str-chat__message-text"
              tabIndex={0}
            >
              <div
                className="str-chat__message-text-inner str-chat__message-simple-text-inner"
                data-testid="message-text-inner-wrapper"
                onClick={[Function]}
                onMouseOver={[Function]}
              >
                <div>
                  <p>
                    hello world
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  });

  it('should render with a custom inner class when one is set', async () => {
    const customInnerClass = 'custom-inner';
    const message = generateMessage({ text: 'hi mate' });
    const tree = await renderMessageText({ customInnerClass, message }, {}, testRenderer.create);
    expect(tree.toJSON()).toMatchInlineSnapshot(`
      <div
        className="str-chat__message str-chat__message-simple str-chat__message--regular str-chat__message--received str-chat__message--other str-chat__message--has-text"
      >
        <div
          className="str-chat__message-inner"
          data-testid="message-inner"
        >
          <div />
          <div
            className="str-chat__message-reactions-host"
          />
          <div
            className="str-chat__message-bubble"
          >
            <div
              className="str-chat__message-text"
              tabIndex={0}
            >
              <div
                className="str-chat__message-text-inner str-chat__message-simple-text-inner"
                data-testid="message-text-inner-wrapper"
                onClick={[Function]}
                onMouseOver={[Function]}
              >
                <div>
                  <p>
                    hi mate
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  });

  it('should render with custom theme identifier in generated css classes when theme is set', async () => {
    const message = generateMessage({ text: 'whatup?!' });
    const tree = await renderMessageText({ message, theme: 'custom' }, {}, testRenderer.create);
    expect(tree.toJSON()).toMatchInlineSnapshot(`
      <div
        className="str-chat__message str-chat__message-simple str-chat__message--regular str-chat__message--received str-chat__message--other str-chat__message--has-text"
      >
        <div
          className="str-chat__message-inner"
          data-testid="message-inner"
        >
          <div />
          <div
            className="str-chat__message-reactions-host"
          />
          <div
            className="str-chat__message-bubble"
          >
            <div
              className="str-chat__message-text"
              tabIndex={0}
            >
              <div
                className="str-chat__message-text-inner str-chat__message-simple-text-inner"
                data-testid="message-text-inner-wrapper"
                onClick={[Function]}
                onMouseOver={[Function]}
              >
                <div>
                  <p>
                    whatup?!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  });
});
