import { useEffect } from 'react';
import type {
  MessageResponse,
  PollResponseData,
  PollVoteResponseData,
} from 'stream-chat';
import { formatMessage, nowNs } from 'stream-chat';
import { useChannel, useChatContext } from 'stream-chat-react';

export const LOCAL_POLL_MESSAGE_ID = 'docs-v15-ck-trip-edit-poll';
const POLL_ID = 'docs-v15-ck-trip-edit-poll-poll';

/**
 * For the screenshots only, not part of the recipe: `?poll=local` adds a poll from the user to the
 * channel, as if the user had sent it. The demo app refuses polls, so the poll exists on this
 * device only: it goes into `client.polls` and its message into the channel's paginator, and no
 * request is sent. Bob and Cara voted for Saturday, Dan for Sunday.
 */
export const ShowPollLocally = () => {
  const { client } = useChatContext();
  const channel = useChannel();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('poll') !== 'local') return;
    const userId = client.user?.id;
    if (!userId) return;

    const addPoll = () => {
      const { members } = channel.state.getLatestValue();
      const user = members[userId]?.user;
      if (!user) return;
      // Wire timestamps are nanosecond numbers; `nowNs()` puts the poll after the latest message.
      const now = nowNs();
      const vote = (
        id: string,
        optionId: string,
        voterId: string,
      ): PollVoteResponseData => ({
        created_at: now,
        id,
        option_id: optionId,
        poll_id: POLL_ID,
        updated_at: now,
        user: members[voterId]?.user,
        user_id: voterId,
      });
      const saturday = [
        vote('docs-v15-ck-vote-1', 'saturday', 'docs-v15-ck-bob'),
        vote('docs-v15-ck-vote-2', 'saturday', 'docs-v15-ck-cara'),
      ];
      const sunday = [vote('docs-v15-ck-vote-3', 'sunday', 'docs-v15-ck-dan')];
      const poll: PollResponseData = {
        allow_answers: true,
        allow_user_suggested_options: false,
        answers_count: 0,
        created_at: now,
        created_by: user,
        created_by_id: userId,
        custom: {},
        description: '',
        enforce_unique_vote: false,
        id: POLL_ID,
        latest_answers: [],
        latest_votes_by_option: { saturday, sunday },
        max_votes_allowed: 2,
        name: 'Which day works for the hike?',
        options: [
          { custom: {}, id: 'saturday', text: 'Saturday' },
          { custom: {}, id: 'sunday', text: 'Sunday' },
          { custom: {}, id: 'either', text: 'Either day' },
        ],
        own_votes: [],
        updated_at: now,
        vote_count: 3,
        vote_counts_by_option: { saturday: 2, sunday: 1 },
        voting_visibility: 'public',
      };
      const message: MessageResponse = {
        attachments: [],
        cid: channel.cid,
        created_at: now,
        custom: {},
        deleted_reply_count: 0,
        html: '',
        id: LOCAL_POLL_MESSAGE_ID,
        latest_reactions: [],
        mentioned_channel: false,
        mentioned_here: false,
        mentioned_users: [],
        own_reactions: [],
        pinned: false,
        poll,
        poll_id: POLL_ID,
        reaction_counts: {},
        reaction_scores: {},
        reply_count: 0,
        restricted_visibility: [],
        shadowed: false,
        silent: false,
        text: '',
        type: 'regular',
        updated_at: now,
        user,
      };
      // The poll first: the message renders its poll from `client.polls`.
      client.polls.hydratePollCache([message]);
      channel.messagePaginator.ingestItem(formatMessage(message));
    };

    // Waits for the first page, so the poll lands after the channel's latest message. The store
    // calls the handler at once with its current value.
    let added = false;
    const unsubscribe = channel.messagePaginator.state.subscribe(({ items }) => {
      if (added || !items?.length) return;
      added = true;
      addPoll();
    });
    return unsubscribe;
  }, [channel, client]);

  return null;
};
