import React from 'react';
import { Poll } from 'stream-chat';
import type { Channel, StreamChat } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PollActions } from '../PollActions';
import {
  ChannelInstanceProvider,
  ChatProvider,
  MessageProvider,
  ModalDialogManagerProvider,
  PollProvider,
  TranslationProvider,
} from '../../../context';
import {
  generateChannelState,
  generateMessage,
  generatePoll,
  generateUser,
  getTestClientWithUser,
  mockChatContext,
  mockMessageContext,
  mockTranslationContextValue,
} from '../../../mock-builders';
import { mockT } from '../../../mock-builders/translator';

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

const SUGGEST_OPTION_ACTION_TEXT = 'Suggest an Option';
const UPDATE_COMMENT_ACTION_TEXT = 'Update Your Comment';
const VIEW_COMMENTS_ACTION_TEXT = 'View 1 Comment';
const VIEW_RESULTS_ACTION_TEXT = 'View Results';
const END_VOTE_ACTION_TEXT = 'End Poll';

const t = mockT;

const defaultChannelStateContext = {
  channelCapabilities: { 'cast-poll-vote': true, 'query-poll-votes': true },
};

const defaultMessageContext = {
  message: generateMessage(),
};

const renderComponent = async ({
  channelStateContext,
  client: customClient,
  messageContext,
  poll,
  props,
}: any = {}) => {
  const client = customClient ?? (await getTestClientWithUser());
  const channel = makeChannel(
    { ...defaultChannelStateContext, ...channelStateContext }.channelCapabilities,
  );
  return render(
    <ChatProvider value={mockChatContext({ client })}>
      <ChannelInstanceProvider value={{ channel }}>
        <ModalDialogManagerProvider>
          <TranslationProvider value={mockTranslationContextValue({ t })}>
            <MessageProvider
              value={mockMessageContext({ ...defaultMessageContext, ...messageContext })}
            >
              <PollProvider poll={poll}>
                <PollActions {...props} />
              </PollProvider>
            </MessageProvider>
          </TranslationProvider>
        </ModalDialogManagerProvider>
      </ChannelInstanceProvider>
    </ChatProvider>,
  );
};
describe('PollActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('does not show "Suggest an option" action if poll is not closed and suggestions are allowed but user does not have permission to cast vote', async () => {
    const pollData = generatePoll({
      allow_user_suggested_options: true,
      is_closed: false,
    });
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollData });
    await renderComponent({
      channelStateContext: { channelCapabilities: { 'cast-poll-vote': false } },
      poll,
    });
    expect(screen.queryByText(SUGGEST_OPTION_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('shows "Suggest an option" action if poll is not closed and suggestions are allowed and user has permission to cast votes', async () => {
    const pollData = generatePoll({
      allow_user_suggested_options: true,
      is_closed: false,
    });
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollData });
    await renderComponent({ poll });
    expect(screen.getByText(SUGGEST_OPTION_ACTION_TEXT)).toBeInTheDocument();
  });

  it('hides "Suggest an option" action if poll is closed', async () => {
    const pollData = generatePoll({
      allow_user_suggested_options: true,
      is_closed: true,
    });
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollData });
    await renderComponent({ poll });
    expect(screen.queryByText(SUGGEST_OPTION_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('hides "Suggest an option" action if suggestions are not allowed', async () => {
    const pollData = generatePoll({
      allow_user_suggested_options: false,
      is_closed: false,
    });
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollData });
    await renderComponent({ poll });
    expect(screen.queryByText(SUGGEST_OPTION_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('shows "Update your comment" action', async () => {
    const pollData = generatePoll({ allow_answers: true, is_closed: false });
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollData });
    await renderComponent({ poll });
    expect(screen.getByText(UPDATE_COMMENT_ACTION_TEXT)).toBeInTheDocument();
  });

  it('hides "Update your comment" action if poll is closed', async () => {
    const pollData = generatePoll({ allow_answers: true, is_closed: true });
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollData });
    await renderComponent({ poll });
    expect(screen.queryByText(UPDATE_COMMENT_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('hides "Update your comment" action if answers are not allowed', async () => {
    const pollData = generatePoll({ allow_answers: false, is_closed: false });
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollData });
    await renderComponent({ poll });
    expect(screen.queryByText(UPDATE_COMMENT_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('shows "View {{count}} comments" action if answers exist and query-poll-votes permission is granted', async () => {
    const pollData = generatePoll({ answers_count: 1 });
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollData });
    await renderComponent({ poll });
    expect(screen.getByText(VIEW_COMMENTS_ACTION_TEXT)).toBeInTheDocument();
  });

  it('hides "View {{count}} comments" action if there are no answers', async () => {
    const pollData = generatePoll({ answers_count: 0 });
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollData });
    await renderComponent({ poll });
    expect(screen.queryByText(VIEW_COMMENTS_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('hides "View {{count}} comments" action if the query-poll-votes permission is not granted', async () => {
    const pollData = generatePoll({ answers_count: 1 });
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollData });
    await renderComponent({
      channelStateContext: { channelCapabilities: { 'query-poll-votes': false } },
      poll,
    });
    expect(screen.queryByText(VIEW_COMMENTS_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('shows "View results" action', async () => {
    const pollData = generatePoll();
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollData });
    await renderComponent({ poll });
    expect(screen.getByText(VIEW_RESULTS_ACTION_TEXT)).toBeInTheDocument();
  });

  it('shows "End poll" action if not closed already and the poll is own', async () => {
    const user = generateUser();
    const client = await getTestClientWithUser(user);
    const pollData = generatePoll({ created_by_id: user.id, is_closed: false });
    const poll = new Poll({ client, poll: pollData });
    await renderComponent({ client, poll });
    expect(screen.getByText(END_VOTE_ACTION_TEXT)).toBeInTheDocument();
  });

  it('hides "End poll" action if poll is closed', async () => {
    const user = generateUser();
    const client = await getTestClientWithUser(user);
    const pollData = generatePoll({ created_by_id: user.id, is_closed: true });
    const poll = new Poll({ client, poll: pollData });
    await renderComponent({ client, poll });
    expect(screen.queryByText(END_VOTE_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('hides "End poll" action if the poll is not own', async () => {
    const user = generateUser();
    const client = await getTestClientWithUser(user);
    const pollData = generatePoll({ is_closed: false });
    const poll = new Poll({ client, poll: pollData });
    await renderComponent({ client, poll });
    expect(screen.queryByText(END_VOTE_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('allows custom actions contents overrides', async () => {
    const user = generateUser();
    const client = await getTestClientWithUser(user);
    const pollData = generatePoll({
      allow_answers: true,
      allow_user_suggested_options: true,
      answers_count: 1,
      created_by_id: user.id,
      is_closed: false,
    });
    const poll = new Poll({ client, poll: pollData });

    const SuggestPollOptionForm = () => (
      <div data-testid='suggest-poll-option-form-custom' />
    );
    const AddCommentPrompt = () => <div data-testid='add-comment-form-custom' />;
    const PollAnswerList = () => <div data-testid='poll-answer-list-custom' />;
    const PollResults = () => <div data-testid='poll-results-custom' />;
    const EndPollAlert = () => <div data-testid='end-poll-dialog-custom' />;

    await renderComponent({
      client,
      poll,
      props: {
        AddCommentPrompt,
        EndPollAlert,
        PollAnswerList,
        PollResults,
        SuggestPollOptionForm,
      },
    });
    act(() => {
      fireEvent.click(screen.getByText(SUGGEST_OPTION_ACTION_TEXT));
    });
    await waitFor(() => {
      expect(screen.getByTestId('suggest-poll-option-form-custom')).toBeInTheDocument();
    });
    act(() => {
      fireEvent.click(screen.getByText(UPDATE_COMMENT_ACTION_TEXT));
    });
    await waitFor(() => {
      expect(screen.getByTestId('add-comment-form-custom')).toBeInTheDocument();
    });
    act(() => {
      fireEvent.click(screen.getByText(VIEW_COMMENTS_ACTION_TEXT));
    });
    await waitFor(() => {
      expect(screen.getByTestId('poll-answer-list-custom')).toBeInTheDocument();
    });
    act(() => {
      fireEvent.click(screen.getByText(VIEW_RESULTS_ACTION_TEXT));
    });
    await waitFor(() => {
      expect(screen.getByTestId('poll-results-custom')).toBeInTheDocument();
    });
    act(() => {
      fireEvent.click(screen.getByText(END_VOTE_ACTION_TEXT));
    });
    await waitFor(() => {
      expect(screen.getByTestId('end-poll-dialog-custom')).toBeInTheDocument();
    });
  });
});
