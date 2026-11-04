import { useEffect } from 'react';
import type {
  Attachment,
  LocalAttachment,
  MessageResponse,
  PollResponseData,
} from 'stream-chat';
import { formatMessage, nowNs } from 'stream-chat';
import { useChatContext } from 'stream-chat-react';

/**
 * For the screenshots only, not part of the recipe. The demo app refuses polls, so in the channel
 * `?channel=` this helper stands in for the Create poll dialog without a request:
 * - `?poll=composer` registers a poll in `client.polls` on this device, sets the composer's
 *   `pollId` to it, types a message and adds an image by URL.
 * - `?poll=sent` adds the message with the poll, its text and the image to the channel, as if the
 *   user had sent it. It goes into the channel's paginator on this device only; no request is sent.
 * The demo app's uploads never finish, so the image is a URL the composer holds as already uploaded.
 */

const POLL_ID = 'cookbook-local-hike-poll';
const MESSAGE_ID = 'cookbook-local-hike-poll-message';
const MESSAGE_TEXT = 'Trying to pin down the hike. Which day works for you?';
const IMAGE: Attachment = {
  custom: {},
  fallback: 'trail.jpg',
  image_url: 'https://picsum.photos/id/1018/640/427',
  type: 'image',
};
// The composer sends only attachments whose upload state is `finished`, and the type requires a
// file, so it gets an empty one.
const LOCAL_IMAGE: LocalAttachment = {
  ...IMAGE,
  localMetadata: {
    file: new File([], 'trail.jpg'),
    id: 'cookbook-local-hike-image',
    uploadState: 'finished',
  },
};

export const DemoPollShots = () => {
  const { client } = useChatContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('channel');
    const mode = params.get('poll');
    if (!channelId || (mode !== 'composer' && mode !== 'sent')) return;
    const channel = client.channel('messaging', channelId);

    // Waits for the channel's first page and for its composer, which resets its state while it sets up.
    const timer = setInterval(() => {
      const author = channel.state.getLatestValue().members[client.userId ?? '']?.user;
      if (
        !channel.messagePaginator.items?.length ||
        !author ||
        !document.querySelector('.str-chat__channel textarea')
      )
        return;
      clearInterval(timer);

      // Wire timestamps are nanosecond numbers.
      const now = nowNs();
      const poll: PollResponseData = {
        allow_answers: false,
        allow_user_suggested_options: false,
        answers_count: 0,
        created_at: now,
        created_by: author,
        created_by_id: author.id,
        custom: {},
        description: '',
        enforce_unique_vote: true,
        id: POLL_ID,
        latest_answers: [],
        latest_votes_by_option: {},
        name: 'Hike day',
        options: [
          { custom: {}, id: 'cookbook-hike-saturday', text: 'Saturday' },
          { custom: {}, id: 'cookbook-hike-sunday', text: 'Sunday' },
          { custom: {}, id: 'cookbook-hike-either', text: 'Either works' },
        ],
        own_votes: [],
        updated_at: now,
        vote_count: 0,
        vote_counts_by_option: {},
        voting_visibility: 'public',
      };

      if (mode === 'sent') {
        const message: MessageResponse = {
          attachments: [IMAGE],
          cid: channel.cid,
          created_at: now,
          custom: {},
          deleted_reply_count: 0,
          html: '',
          id: MESSAGE_ID,
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
          text: MESSAGE_TEXT,
          type: 'regular',
          updated_at: now,
          user: author,
        };
        // The poll first: the message renders its poll from `client.polls`.
        client.polls.hydratePollCache([message]);
        channel.messagePaginator.ingestItem(formatMessage(message));
        return;
      }

      // What `createPoll()` does after the server answers: caches the poll and sets `pollId`.
      client.polls.hydratePollCache([{ poll } as unknown as MessageResponse]);
      const composer = channel.messageComposer;
      composer.state.partialNext({ pollId: POLL_ID });
      composer.textComposer.setText(MESSAGE_TEXT);
      composer.attachmentManager.upsertAttachments([LOCAL_IMAGE]);
    }, 200);

    return () => clearInterval(timer);
  }, [client]);

  return null;
};
