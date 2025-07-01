import React from 'react';
import { Poll } from 'stream-chat';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PollActions } from '../PollActions';
import {
  ChannelStateProvider,
  ChatProvider,
  MessageProvider,
  PollProvider,
  TranslationProvider,
} from '../../../context';
import {
  generateMessage,
  generatePoll,
  generateUser,
  getTestClientWithUser,
} from '../../../mock-builders';
import { MAX_OPTIONS_DISPLAYED } from '../constants';

const SEE_ALL_OPTIONS_ACTION_TEXT = 'See all options ({{count}})';
const SUGGEST_OPTION_ACTION_TEXT = 'Suggest an option';
const UPDATE_COMMENT_ACTION_TEXT = 'Update your comment';
const VIEW_COMMENTS_ACTION_TEXT = 'View {{count}} comments';
const VIEW_RESULTS_ACTION_TEXT = 'View results';
const END_VOTE_ACTION_TEXT = 'End vote';

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
  messageContext,
  poll,
  props,
}) => {
  const client = customClient ?? (await getTestClientWithUser());
  return render(
    <ChatProvider value={{ client }}>
      <TranslationProvider value={{ t }}>
        <ChannelStateProvider
          value={{ ...defaultChannelStateContext, ...channelStateContext }}
        >
          <MessageProvider value={{ ...defaultMessageContext, ...messageContext }}>
            <PollProvider poll={poll}>
              <PollActions {...props} />
            </PollProvider>
          </MessageProvider>
        </ChannelStateProvider>
      </TranslationProvider>
    </ChatProvider>,
  );
};
describe('PollActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('shows "See all options ({{count}})" action if option count is above MAX_OPTIONS_DISPLAYED', async () => {
    const pollData = generatePoll({
      options: Array.from({ length: MAX_OPTIONS_DISPLAYED + 1 }, (_, i) => ({
        id: i.toString(),
        text: i.toString(),
      })),
    });
    const poll = new Poll({ client: {}, poll: pollData });
    await renderComponent({ poll });
    expect(screen.getByText(SEE_ALL_OPTIONS_ACTION_TEXT)).toBeInTheDocument();
  });

  it('hides "See all options ({{count}})" action if option count is below MAX_OPTIONS_DISPLAYED', async () => {
    const pollData = generatePoll({
      options: Array.from({ length: MAX_OPTIONS_DISPLAYED }, (_, i) => ({
        id: i.toString(),
        text: i.toString(),
      })),
    });
    const poll = new Poll({ client: {}, poll: pollData });
    await renderComponent({ poll });
    expect(screen.queryByText(SEE_ALL_OPTIONS_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('shows "Suggest an option" action if poll is not closed and suggestions are allowed', async () => {
    const pollData = generatePoll({
      allow_user_suggested_options: true,
      is_closed: false,
    });
    const poll = new Poll({ client: {}, poll: pollData });
    await renderComponent({ poll });
    expect(screen.getByText(SUGGEST_OPTION_ACTION_TEXT)).toBeInTheDocument();
  });

  it('hides "Suggest an option" action if poll is closed', async () => {
    const pollData = generatePoll({
      allow_user_suggested_options: true,
      is_closed: true,
    });
    const poll = new Poll({ client: {}, poll: pollData });
    await renderComponent({ poll });
    expect(screen.queryByText(SUGGEST_OPTION_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('hides "Suggest an option" action if suggestions are not allowed', async () => {
    const pollData = generatePoll({
      allow_user_suggested_options: false,
      is_closed: false,
    });
    const poll = new Poll({ client: {}, poll: pollData });
    await renderComponent({ poll });
    expect(screen.queryByText(SUGGEST_OPTION_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('shows "Update your comment" action', async () => {
    const pollData = generatePoll({ allow_answers: true, is_closed: false });
    const poll = new Poll({ client: {}, poll: pollData });
    await renderComponent({ poll });
    expect(screen.getByText(UPDATE_COMMENT_ACTION_TEXT)).toBeInTheDocument();
  });

  it('hides "Update your comment" action if poll is closed', async () => {
    const pollData = generatePoll({ allow_answers: true, is_closed: true });
    const poll = new Poll({ client: {}, poll: pollData });
    await renderComponent({ poll });
    expect(screen.queryByText(UPDATE_COMMENT_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('hides "Update your comment" action if answers are not allowed', async () => {
    const pollData = generatePoll({ allow_answers: false, is_closed: false });
    const poll = new Poll({ client: {}, poll: pollData });
    await renderComponent({ poll });
    expect(screen.queryByText(UPDATE_COMMENT_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('shows "View {{count}} comments" action if answers exist and query-poll-votes permission is granted', async () => {
    const pollData = generatePoll({ answers_count: 1 });
    const poll = new Poll({ client: {}, poll: pollData });
    await renderComponent({ poll });
    expect(screen.getByText(VIEW_COMMENTS_ACTION_TEXT)).toBeInTheDocument();
  });

  it('hides "View {{count}} comments" action if there are no answers', async () => {
    const pollData = generatePoll({ answers_count: 0 });
    const poll = new Poll({ client: {}, poll: pollData });
    await renderComponent({ poll });
    expect(screen.queryByText(VIEW_COMMENTS_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('hides "View {{count}} comments" action if the query-poll-votes permission is not granted', async () => {
    const pollData = generatePoll({ answers_count: 1 });
    const poll = new Poll({ client: {}, poll: pollData });
    await renderComponent({
      channelStateContext: { channelCapabilities: { 'query-poll-votes': false } },
      poll,
    });
    expect(screen.queryByText(VIEW_COMMENTS_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('shows "View results" action', async () => {
    const pollData = generatePoll();
    const poll = new Poll({ client: {}, poll: pollData });
    await renderComponent({ poll });
    expect(screen.getByText(VIEW_RESULTS_ACTION_TEXT)).toBeInTheDocument();
  });

  it('shows "End vote" action if not closed already and the poll is own', async () => {
    const user = generateUser();
    const client = await getTestClientWithUser(user);
    const pollData = generatePoll({ created_by_id: user.id, is_closed: false });
    const poll = new Poll({ client, poll: pollData });
    await renderComponent({ client, poll });
    expect(screen.getByText(END_VOTE_ACTION_TEXT)).toBeInTheDocument();
  });

  it('hides "End vote" action if poll is closed', async () => {
    const user = generateUser();
    const client = await getTestClientWithUser(user);
    const pollData = generatePoll({ created_by_id: user.id, is_closed: true });
    const poll = new Poll({ client, poll: pollData });
    await renderComponent({ client, poll });
    expect(screen.queryByText(END_VOTE_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('hides "End vote" action if the poll is not own', async () => {
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
      options: Array.from({ length: MAX_OPTIONS_DISPLAYED + 1 }, (_, i) => ({
        id: i.toString(),
        text: i.toString(),
      })),
    });
    const poll = new Poll({ client, poll: pollData });

    const PollOptionsFullList = () => <div data-testid='poll-options-full-list-custom' />;
    const SuggestPollOptionForm = () => (
      <div data-testid='suggest-poll-option-form-custom' />
    );
    const AddCommentForm = () => <div data-testid='add-comment-form-custom' />;
    const PollAnswerList = () => <div data-testid='poll-answer-list-custom' />;
    const PollResults = () => <div data-testid='poll-results-custom' />;
    const EndPollDialog = () => <div data-testid='end-poll-dialog-custom' />;

    await renderComponent({
      client,
      poll,
      props: {
        AddCommentForm,
        EndPollDialog,
        PollAnswerList,
        PollOptionsFullList,
        PollResults,
        SuggestPollOptionForm,
      },
    });
    act(() => {
      fireEvent.click(screen.getByText(SEE_ALL_OPTIONS_ACTION_TEXT));
    });
    await waitFor(() => {
      expect(screen.getByTestId('poll-options-full-list-custom')).toBeInTheDocument();
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
