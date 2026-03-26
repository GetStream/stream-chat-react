import React from 'react';
import { Poll } from 'stream-chat';
import type { StreamChat } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PollOptionList } from '../PollOptionList';
import {
  ChannelStateProvider,
  ChatProvider,
  MessageProvider,
  ModalDialogManagerProvider,
  PollProvider,
  TranslationProvider,
} from '../../../context';
import {
  generateMessage,
  generatePoll,
  generatePollVoteCastedEvent,
  generatePollVoteRemovedEvent,
  generateUser,
  getTestClientWithUser,
  mockChannelStateContext,
  mockChatContext,
  mockMessageContext,
  mockTranslationContextValue,
} from '../../../mock-builders';

const OPTION_SELECTOR = '.str-chat__poll-option';
const VOTABLE_OPTION_SELECTOR = '.str-chat__poll-option--votable';
const CHECKMARK_SELECTOR = '.str-chat__checkmark';
const CHECKMARK_CHECKED_SELECTOR = '.str-chat__checkmark--checked';
const VOTE_COUNT_SELECTOR = '.str-chat__poll-option-vote-count';

const MORE_OPTIONS_ACTION_TEXT = '+{{count}} more options';

const pollWithNoVotes = generatePoll({
  answers_count: 1,
  latest_answers: [],
  latest_votes_by_option: {},
  own_votes: [],
  vote_count: 0,
  vote_counts_by_option: {},
});

const t = (v: any) => v;

const defaultChannelStateContext = {
  channelCapabilities: { 'cast-poll-vote': true },
};

const defaultMessageContext = {
  message: generateMessage(),
};

describe('PollOptionList', () => {
  let chatClient: StreamChat;

  beforeAll(async () => {
    chatClient = await getTestClientWithUser();
  });

  const renderComponent = ({
    channelStateContext,
    messageContext,
    poll,
    pollOptionListProps,
  }: any) =>
    render(
      <ChatProvider value={mockChatContext({ client: chatClient })}>
        <ModalDialogManagerProvider>
          <TranslationProvider value={mockTranslationContextValue({ t })}>
            <ChannelStateProvider
              value={mockChannelStateContext({
                ...defaultChannelStateContext,
                ...channelStateContext,
              })}
            >
              <MessageProvider
                value={mockMessageContext({
                  ...defaultMessageContext,
                  ...messageContext,
                })}
              >
                <PollProvider poll={poll}>
                  <PollOptionList {...pollOptionListProps} />
                </PollProvider>
              </MessageProvider>
            </ChannelStateProvider>
          </TranslationProvider>
        </ModalDialogManagerProvider>
      </ChatProvider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty container if no options', () => {
    const pollData = generatePoll({ options: [] });
    const { container } = renderComponent({
      poll: new Poll({ client: fromPartial<StreamChat>({}), poll: pollData }),
    });
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('shows "+{{count}} more options" when options exceed optionsDisplayCount', () => {
    const pollData = generatePoll({
      options: Array.from({ length: 6 }, (_, i) => ({
        id: `opt-${i}`,
        text: `Option ${i}`,
      })),
    });
    renderComponent({
      poll: new Poll({ client: fromPartial<StreamChat>({}), poll: pollData }),
      pollOptionListProps: { optionsDisplayCount: 3 },
    });
    expect(screen.getByText(MORE_OPTIONS_ACTION_TEXT)).toBeInTheDocument();
  });

  it('hides "+{{count}} more options" when options fit within optionsDisplayCount', () => {
    const pollData = generatePoll({
      options: Array.from({ length: 3 }, (_, i) => ({
        id: `opt-${i}`,
        text: `Option ${i}`,
      })),
    });
    renderComponent({
      poll: new Poll({ client: fromPartial<StreamChat>({}), poll: pollData }),
      pollOptionListProps: { optionsDisplayCount: 3 },
    });
    expect(screen.queryByText(MORE_OPTIONS_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('hides "+{{count}} more options" when optionsDisplayCount is undefined', () => {
    const pollData = generatePoll({
      options: Array.from({ length: 10 }, (_, i) => ({
        id: `opt-${i}`,
        text: `Option ${i}`,
      })),
    });
    renderComponent({
      poll: new Poll({ client: fromPartial<StreamChat>({}), poll: pollData }),
    });
    expect(screen.queryByText(MORE_OPTIONS_ACTION_TEXT)).not.toBeInTheDocument();
  });

  it('allows custom PollOptionsFullList override in the modal', async () => {
    const pollData = generatePoll({
      options: Array.from({ length: 6 }, (_, i) => ({
        id: `opt-${i}`,
        text: `Option ${i}`,
      })),
    });
    const PollOptionsFullList = () => <div data-testid='poll-options-full-list-custom' />;
    renderComponent({
      poll: new Poll({ client: fromPartial<StreamChat>({}), poll: pollData }),
      pollOptionListProps: {
        optionsDisplayCount: 3,
        PollOptionsFullList,
      },
    });
    act(() => {
      fireEvent.click(screen.getByText(MORE_OPTIONS_ACTION_TEXT));
    });
    await waitFor(() => {
      expect(screen.getByTestId('poll-options-full-list-custom')).toBeInTheDocument();
    });
  });

  it('renders votable poll option selectors', () => {
    const pollData = generatePoll();
    const { container } = renderComponent({
      poll: new Poll({ client: fromPartial<StreamChat>({}), poll: pollData }),
    });
    const votableOptions = container.querySelectorAll(VOTABLE_OPTION_SELECTOR);
    expect(votableOptions).toHaveLength(pollData.options.length);
    votableOptions.forEach((o) => {
      expect(o.querySelector(CHECKMARK_SELECTOR)).toBeDefined();
    });
  });

  it('renders non-votable poll option selectors if poll is closed and does nothing on option click', () => {
    const pollData = generatePoll({ is_closed: true });
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollData });
    const castVoteSpy = vi.spyOn(poll, 'castVote').mockResolvedValue(fromPartial({}));
    const removeVoteSpy = vi.spyOn(poll, 'removeVote').mockResolvedValue(fromPartial({}));
    const { container } = renderComponent({ poll });
    const votableOptions = container.querySelectorAll(VOTABLE_OPTION_SELECTOR);
    const options = container.querySelectorAll(OPTION_SELECTOR);
    expect(votableOptions).toHaveLength(0);
    expect(options).toHaveLength(pollData.options.length);
    options.forEach((o) => {
      expect(o.querySelector(CHECKMARK_SELECTOR)).toBeNull();
    });

    act(() => {
      fireEvent.click(options[0]);
    });

    expect(castVoteSpy).not.toHaveBeenCalled();
    expect(removeVoteSpy).not.toHaveBeenCalled();
  });

  it('renders non-votable poll option selectors if missing voting permission and does nothing on option click', () => {
    const pollData = generatePoll();
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollData });
    const castVoteSpy = vi.spyOn(poll, 'castVote').mockResolvedValue(fromPartial({}));
    const removeVoteSpy = vi.spyOn(poll, 'removeVote').mockResolvedValue(fromPartial({}));
    const { container } = renderComponent({
      channelStateContext: { channelCapabilities: { 'cast-poll-vote': false } },
      poll,
    });
    const votableOptions = container.querySelectorAll(VOTABLE_OPTION_SELECTOR);
    const options = container.querySelectorAll(OPTION_SELECTOR);
    expect(votableOptions).toHaveLength(0);
    expect(options).toHaveLength(pollData.options.length);
    options.forEach((o) => {
      expect(o.querySelector(CHECKMARK_SELECTOR)).toBeNull();
    });

    act(() => {
      fireEvent.click(options[0]);
    });

    expect(castVoteSpy).not.toHaveBeenCalled();
    expect(removeVoteSpy).not.toHaveBeenCalled();
  });

  it('renders voter avatars with each option', () => {
    const pollData = generatePoll();
    const { container } = renderComponent({
      poll: new Poll({ client: fromPartial<StreamChat>({}), poll: pollData }),
    });
    const votableOptions = container.querySelectorAll(VOTABLE_OPTION_SELECTOR);
    expect(votableOptions).toHaveLength(pollData.options.length);
    votableOptions.forEach((o, i) => {
      const optionId = pollData.options[i].id;
      const voteCount = pollData.vote_counts_by_option[optionId] ?? 0;
      const optionAvatars = o.querySelectorAll('[data-testid="avatar"]');
      expect(optionAvatars).toHaveLength(voteCount);
    });
  });

  it('does not renders voter avatars with options for anonymous poll', () => {
    const pollData = generatePoll({ voting_visibility: 'anonymous' as any });
    const { container } = renderComponent({
      poll: new Poll({ client: fromPartial<StreamChat>({}), poll: pollData }),
    });
    const votableOptions = container.querySelectorAll(VOTABLE_OPTION_SELECTOR);
    expect(votableOptions).toHaveLength(pollData.options.length);
    votableOptions.forEach((o) => {
      const optionAvatars = o.querySelectorAll('[data-testid="avatar"]');
      expect(optionAvatars).toHaveLength(0);
    });
  });

  it('casts a vote if not voted previously for a given option', async () => {
    const poll = new Poll({
      client: fromPartial<StreamChat>({}),
      poll: pollWithNoVotes,
    });
    const castVoteSpy = vi.spyOn(poll, 'castVote').mockResolvedValue(fromPartial({}));
    const removeVoteSpy = vi.spyOn(poll, 'removeVote').mockResolvedValue(fromPartial({}));
    const { container } = renderComponent({ poll });
    const votableOptions = container.querySelectorAll(VOTABLE_OPTION_SELECTOR);

    act(() => {
      fireEvent.click(votableOptions[0]);
    });
    await waitFor(() => {
      expect(removeVoteSpy).not.toHaveBeenCalled();
      expect(castVoteSpy).toHaveBeenCalledWith(
        pollWithNoVotes.options[0].id,
        defaultMessageContext.message.id,
      );
    });
  });

  it('updates the UI on cast poll vote state update', () => {
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollWithNoVotes });
    const { container } = renderComponent({ poll });
    const votableOptions = container.querySelectorAll(VOTABLE_OPTION_SELECTOR);
    votableOptions.forEach((option) => {
      expect(option.querySelector(VOTE_COUNT_SELECTOR)).toHaveTextContent('0');
    });
    act(() => {
      poll.handleVoteCasted(
        generatePollVoteCastedEvent({
          poll: {
            ...pollWithNoVotes,
            ...{
              answers_count: 1,
              latest_answers: [],
              latest_votes_by_option: {}, // ignored
              own_votes: [],
              vote_count: 1,
              vote_counts_by_option: { [pollWithNoVotes.options[0].id]: 1 },
            },
          },
        }),
      );
    });
    expect(votableOptions[0].querySelector(VOTE_COUNT_SELECTOR)).toHaveTextContent('1');
    expect(votableOptions[1].querySelector(VOTE_COUNT_SELECTOR)).toHaveTextContent('0');
  });

  it('updates the UI on cast poll vote state update with own vote', async () => {
    const user = generateUser();
    const client = await getTestClientWithUser(user);
    const poll = new Poll({ client, poll: pollWithNoVotes });
    const { container } = renderComponent({ poll });
    const votableOptions = container.querySelectorAll(VOTABLE_OPTION_SELECTOR);
    act(() => {
      poll.handleVoteCasted(
        generatePollVoteCastedEvent({
          poll: {
            ...pollWithNoVotes,
            ...{
              answers_count: 1,
              latest_answers: [],
              latest_votes_by_option: {}, // ignored
              own_votes: [],
              vote_count: 1,
              vote_counts_by_option: { [pollWithNoVotes.options[0].id]: 1 },
            },
          },
          pollVote: {
            created_at: new Date().toISOString(),
            id: '4c552daf-8f72-409c-a2ee-313b9db9fcd0',
            option_id: pollWithNoVotes.options[0].id,
            poll_id: pollWithNoVotes.id,
            updated_at: new Date().toISOString(),
            user,
            user_id: user.id,
          },
        }),
      );
    });
    await waitFor(() => {
      votableOptions.forEach((votableOption, i) => {
        if (i === 0) {
          expect(
            votableOption.querySelector(CHECKMARK_CHECKED_SELECTOR),
          ).toBeInTheDocument();
          expect(votableOption.querySelector(VOTE_COUNT_SELECTOR)).toHaveTextContent('1');
        } else {
          expect(
            votableOption.querySelector(CHECKMARK_CHECKED_SELECTOR),
          ).not.toBeInTheDocument();
          expect(votableOption.querySelector(VOTE_COUNT_SELECTOR)).toHaveTextContent('0');
        }
      });
    });
  });

  it('removes the vote if voted previously for a given option', async () => {
    const pollData = generatePoll();
    const removedVoteOptionId = pollData.options[0].id;
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: pollData });
    const { container } = renderComponent({ poll });
    const expectedVoteCountsByOption = {
      ...pollData.vote_counts_by_option,
      [removedVoteOptionId]: pollData.vote_counts_by_option[removedVoteOptionId] - 1,
    };
    act(() => {
      poll.handleVoteRemoved(
        generatePollVoteRemovedEvent({
          poll: {
            ...pollData,
            ...{
              latest_votes_by_option: {}, // ignored
              own_votes: [],
              vote_count: pollData.vote_count - 1,
              vote_counts_by_option: expectedVoteCountsByOption,
            },
          },
        }),
      );
    });
    await waitFor(() => {
      const votableOptions = container.querySelectorAll(VOTABLE_OPTION_SELECTOR);

      votableOptions.forEach((votableOption, i) => {
        const previousCount = pollData.vote_counts_by_option[pollData.options[i].id] ?? 0;
        const expectedCount =
          previousCount && pollData.options[i].id === removedVoteOptionId
            ? previousCount - 1
            : previousCount;
        expect(votableOption.querySelector(VOTE_COUNT_SELECTOR)).toHaveTextContent(
          expectedCount.toString(),
        );
      });
    });
  });
});
