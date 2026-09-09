import { dateToNs } from 'stream-chat';
import type { LocalMessage } from 'stream-chat';

// Every server-sent date is the unix-**nanosecond** number the API puts on the wire, so a fixture has
// to model that unit — a `Date` here would render as 1970 once the UI converts it. The literals stay
// readable and go through `dateToNs`.
const fireReactionAt = dateToNs(new Date('2026-02-12T06:39:57.188362Z'));
const firstLikeReactionAt = dateToNs(new Date('2026-02-12T06:39:56.237389Z'));
const secondLikeReactionAt = dateToNs(new Date('2026-02-12T06:39:52.237389Z'));
const heartReactionAt = dateToNs(new Date('2026-02-12T06:35:58.021196Z'));

// The generated v10 models require far more fields than a static preview fixture needs
// (`MessageResponse` alone mandates cid, html, deleted_reply_count, …), so the literal is asserted
// once here rather than padded with a dozen placeholder values.
export const reactionsPreviewMessage = {
  created_at: dateToNs(new Date('2026-02-12T06:34:40.000000Z')),
  id: 'settings-preview-message-id',
  latest_reactions: [
    {
      created_at: fireReactionAt,
      custom: {},
      message_id: 'settings-preview-message-id',
      score: 1,
      type: 'fire',
      updated_at: fireReactionAt,
      user: {
        id: 'test-user',
        language: '',
        role: 'user',
        teams: [],
      },
      user_id: 'test-user',
    },
    {
      created_at: firstLikeReactionAt,
      custom: {},
      message_id: 'settings-preview-message-id',
      score: 1,
      type: 'like',
      updated_at: firstLikeReactionAt,
      user: {
        id: 'test-user',
        language: '',
        role: 'user',
        teams: [],
      },
      user_id: 'test-user',
    },
    {
      created_at: secondLikeReactionAt,
      custom: {},
      message_id: 'settings-preview-message-id',
      score: 1,
      type: 'like',
      updated_at: secondLikeReactionAt,
      user: {
        id: 'test-user-2',
        language: '',
        role: 'user',
        teams: [],
      },
      user_id: 'test-user-2',
    },
    {
      created_at: heartReactionAt,
      custom: {},
      message_id: 'settings-preview-message-id',
      score: 1,
      type: 'heart',
      updated_at: heartReactionAt,
      user: { id: 'test-user-2' },
      user_id: 'test-user-2',
    },
  ],
  own_reactions: [
    {
      created_at: fireReactionAt,
      custom: {},
      message_id: 'settings-preview-message-id',
      score: 1,
      type: 'fire',
      updated_at: fireReactionAt,
      user: { id: 'test-user' },
      user_id: 'test-user',
    },
    {
      created_at: firstLikeReactionAt,
      custom: {},
      message_id: 'settings-preview-message-id',
      score: 1,
      type: 'like',
      updated_at: firstLikeReactionAt,
      user: { id: 'test-user' },
      user_id: 'test-user',
    },
    {
      created_at: heartReactionAt,
      custom: {},
      message_id: 'settings-preview-message-id',
      score: 1,
      type: 'heart',
      updated_at: heartReactionAt,
      user: { id: 'test-user' },
      user_id: 'test-user',
    },
  ],
  reaction_counts: { fire: 1, heart: 1, like: 2 },
  reaction_groups: {
    fire: {
      count: 1,
      first_reaction_at: fireReactionAt,
      last_reaction_at: fireReactionAt,
      // v10 requires the most recent reactors per group, ordered most recent first.
      latest_reactions_by: [{ created_at: fireReactionAt, user_id: 'test-user' }],
      sum_scores: 1,
    },
    heart: {
      count: 1,
      first_reaction_at: heartReactionAt,
      last_reaction_at: heartReactionAt,
      latest_reactions_by: [{ created_at: heartReactionAt, user_id: 'test-user-2' }],
      sum_scores: 1,
    },
    like: {
      count: 2,
      first_reaction_at: secondLikeReactionAt,
      last_reaction_at: firstLikeReactionAt,
      latest_reactions_by: [
        { created_at: firstLikeReactionAt, user_id: 'test-user' },
        { created_at: secondLikeReactionAt, user_id: 'test-user-2' },
      ],
      sum_scores: 2,
    },
  },
  reaction_scores: { fire: 1, heart: 1, like: 2 },
  status: 'received',
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed lectus nibh, rutrum in risus eget, dictum commodo dolor. Donec augue nisi, sollicitudin sed magna ut, tincidunt pretium lorem. ',
  type: 'regular',
  updated_at: dateToNs(new Date('2026-02-12T06:40:00.000000Z')),
  // Only the fields the preview renders are supplied; `UserResponse` requires several more.
  user: {
    id: 'settings-preview-user',
    image: 'https://getstream.io/random_svg/?id=preview-user&name=Preview+User',
    name: 'Preview User',
  },
} as unknown as LocalMessage;

export const reactionsPreviewChannelState = {
  channel: {
    state: {
      membership: {
        channel_role: 'channel_member',
        is_moderator: false,
        role: 'member',
      },
    },
  },
  channelCapabilities: {},
  channelConfig: undefined,
  imageAttachmentSizeHandler: () => ({ url: '' }),
  notifications: [],
  shouldGenerateVideoThumbnail: false,
  videoAttachmentSizeHandler: () => ({ url: '' }),
};

export const reactionsPreviewChannelActions = {
  closeThread: () => undefined,
  onMentionsClick: () => undefined,
  onMentionsHover: () => undefined,
  openThread: () => undefined,
};

export const reactionsPreviewOptions = [
  {
    Component: () => '🔥',
    name: 'Fire',
    type: 'fire',
  },
  {
    Component: () => '👍',
    name: 'Thumbs up',
    type: 'like',
  },
  {
    Component: () => '❤️',
    name: 'Heart',
    type: 'heart',
  },
];
