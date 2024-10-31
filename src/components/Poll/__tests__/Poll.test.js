import React from 'react';
import { Poll as PollClass } from 'stream-chat';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Poll } from '../Poll';
import {
  ChannelStateProvider,
  ChatProvider,
  ComponentProvider,
  MessageProvider,
  TranslationProvider,
} from '../../../context';
import { generateMessage, generatePoll, getTestClientWithUser } from '../../../mock-builders';

const POLL_ACTIONS__CLASS = '.str-chat__poll-actions';
const POLL_OPTION_LIST__CLASS = '.str-chat__poll-option-list';
const POLL_HEADER__CLASS = '.str-chat__poll-header';
const QUOTED_POLL__CLASS = '.str-chat__quoted-poll-preview';

const t = (v) => v;

const defaultChannelStateContext = {
  channelCapabilities: { 'query-poll-votes': true },
};

const defaultMessageContext = {
  message: generateMessage(),
};

const renderComponent = async ({
  channelStateContext,
  client: customClient,
  componentContext,
  messageContext,
  props,
}) => {
  const client = customClient ?? (await getTestClientWithUser());
  return render(
    <ChatProvider value={{ client }}>
      <TranslationProvider value={{ t }}>
        <ComponentProvider value={componentContext ?? {}}>
          <ChannelStateProvider value={{ ...defaultChannelStateContext, ...channelStateContext }}>
            <MessageProvider value={{ ...defaultMessageContext, ...messageContext }}>
              <Poll {...props} />
            </MessageProvider>
          </ChannelStateProvider>
        </ComponentProvider>
      </TranslationProvider>
    </ChatProvider>,
  );
};

describe('Poll', () => {
  it('renders default poll UI', async () => {
    const pollData = generatePoll();
    const poll = new PollClass({ client: {}, poll: pollData });
    const { container } = await renderComponent({
      props: { poll },
    });
    expect(container.querySelector(POLL_HEADER__CLASS)).toBeInTheDocument();
    expect(container.querySelector(POLL_OPTION_LIST__CLASS)).toBeInTheDocument();
    expect(container.querySelector(POLL_ACTIONS__CLASS)).toBeInTheDocument();
  });
  it('renders custom PollActions', async () => {
    const pollData = generatePoll();
    const poll = new PollClass({ client: {}, poll: pollData });
    const testId = 'custom-poll-actions';
    const CustomPollActions = () => <div data-testid={testId} />;
    const { container } = await renderComponent({
      componentContext: { PollActions: CustomPollActions },
      props: { poll },
    });
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(container.querySelector(POLL_HEADER__CLASS)).toBeInTheDocument();
    expect(container.querySelector(POLL_OPTION_LIST__CLASS)).toBeInTheDocument();
    expect(container.querySelector(POLL_ACTIONS__CLASS)).not.toBeInTheDocument();
  });

  it('renders quoted version', async () => {
    const pollData = generatePoll();
    const poll = new PollClass({ client: {}, poll: pollData });
    const { container } = await renderComponent({
      props: { isQuoted: true, poll },
    });
    expect(container.querySelector(QUOTED_POLL__CLASS)).toBeInTheDocument();
    expect(container.querySelector(POLL_HEADER__CLASS)).not.toBeInTheDocument();
    expect(container.querySelector(POLL_OPTION_LIST__CLASS)).not.toBeInTheDocument();
    expect(container.querySelector(POLL_ACTIONS__CLASS)).not.toBeInTheDocument();
  });
});
