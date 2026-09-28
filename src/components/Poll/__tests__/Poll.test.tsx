import React from 'react';
import { Poll as PollClass } from 'stream-chat';
import type { Channel, StreamChat } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';
import { render, screen } from '@testing-library/react';
import { Poll } from '../Poll';
import {
  ChannelInstanceProvider,
  ChatProvider,
  ComponentProvider,
  MessageProvider,
  ModalDialogManagerProvider,
  TranslationProvider,
} from '../../../context';
import {
  generateChannelState,
  generateMessage,
  generatePoll,
  getTestClientWithUser,
  mockChatContext,
  mockTranslationContextValue,
} from '../../../mock-builders';
import { mockT } from '../../../mock-builders/translator';

const POLL_ACTIONS__CLASS = '.str-chat__poll-actions';
const POLL_OPTION_LIST__CLASS = '.str-chat__poll-option-list';
const POLL_HEADER__CLASS = '.str-chat__poll-header';

const t = mockT;

// MERGE-RECONCILE (test migration): the deleted ChannelStateContext no longer provides
// `channelCapabilities`. Poll components now read capabilities via useChannelCapabilities({ cid }),
// which subscribes to the unified `channel.state` (`ownCapabilities`, a string[]). Convert the legacy
// `{ 'cap': boolean }` object into that string[] and seed a real ChannelInstanceProvider channel.
const toOwnCapabilities = (capabilities: Record<string, boolean> = {}) =>
  Object.entries(capabilities)
    .filter(([, enabled]) => enabled)
    .map(([capability]) => capability);

const makeChannel = (capabilities: Record<string, boolean> = {}) =>
  fromPartial<Channel>({
    cid: 'messaging:poll-test',
    state: generateChannelState({ ownCapabilities: toOwnCapabilities(capabilities) }),
  });

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
}: any) => {
  const client = customClient ?? (await getTestClientWithUser());
  const channel = makeChannel(
    { ...defaultChannelStateContext, ...channelStateContext }.channelCapabilities,
  );
  return render(
    <ChatProvider value={mockChatContext({ client })}>
      <ChannelInstanceProvider value={{ channel }}>
        <ModalDialogManagerProvider>
          <TranslationProvider value={mockTranslationContextValue({ t })}>
            <ComponentProvider value={componentContext ?? {}}>
              <MessageProvider value={{ ...defaultMessageContext, ...messageContext }}>
                <Poll {...props} />
              </MessageProvider>
            </ComponentProvider>
          </TranslationProvider>
        </ModalDialogManagerProvider>
      </ChannelInstanceProvider>
    </ChatProvider>,
  );
};

describe('Poll', () => {
  it('renders default poll UI', async () => {
    const pollData = generatePoll();
    const poll = new PollClass({ client: fromPartial<StreamChat>({}), poll: pollData });
    const { container } = await renderComponent({
      props: { poll },
    });
    expect(container.querySelector(POLL_HEADER__CLASS)).toBeInTheDocument();
    expect(container.querySelector(POLL_OPTION_LIST__CLASS)).toBeInTheDocument();
    expect(container.querySelector(POLL_ACTIONS__CLASS)).toBeInTheDocument();
  });
  it('renders custom PollActions', async () => {
    const pollData = generatePoll();
    const poll = new PollClass({ client: fromPartial<StreamChat>({}), poll: pollData });
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

  it('allows to override the header', async () => {
    const testId = 'custom-poll-header';
    const PollHeader = () => <div data-testid={testId} />;
    const pollData = generatePoll();
    const poll = new PollClass({ client: fromPartial<StreamChat>({}), poll: pollData });
    const { container } = await renderComponent({
      componentContext: { PollHeader },
      props: { poll },
    });
    expect(container.querySelector(POLL_HEADER__CLASS)).not.toBeInTheDocument();
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(container.querySelector(POLL_OPTION_LIST__CLASS)).toBeInTheDocument();
    expect(container.querySelector(POLL_ACTIONS__CLASS)).toBeInTheDocument();
  });

  it('allows to override the poll option selector', async () => {
    const testId = 'custom-poll-option-selector';
    const PollOptionSelector = () => <div data-testid={testId} />;
    const pollData = generatePoll();
    const poll = new PollClass({ client: fromPartial<StreamChat>({}), poll: pollData });
    const { container } = await renderComponent({
      componentContext: { PollOptionSelector },
      props: { poll },
    });
    expect(screen.getAllByTestId(testId)).toHaveLength(pollData.options.length);
    expect(container.querySelector(POLL_HEADER__CLASS)).toBeInTheDocument();
    expect(container.querySelector(POLL_OPTION_LIST__CLASS)).toBeInTheDocument();
    expect(container.querySelector(POLL_ACTIONS__CLASS)).toBeInTheDocument();
  });

  it('allows to override the poll content', async () => {
    const testId = 'custom-poll-content';
    const PollContent = () => <div data-testid={testId} />;
    const pollData = generatePoll();
    const poll = new PollClass({ client: fromPartial<StreamChat>({}), poll: pollData });
    const { container } = await renderComponent({
      componentContext: { PollContent },
      props: { poll },
    });
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(container.querySelector(POLL_HEADER__CLASS)).not.toBeInTheDocument();
    expect(container.querySelector(POLL_OPTION_LIST__CLASS)).not.toBeInTheDocument();
    expect(container.querySelector(POLL_ACTIONS__CLASS)).not.toBeInTheDocument();
  });
});
