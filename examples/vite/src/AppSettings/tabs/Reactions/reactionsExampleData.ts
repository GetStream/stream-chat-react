import type { LocalMessage } from 'stream-chat';

const fireReactionTimestamp = '2026-02-12T06:39:57.188362Z';
const firstLikeReactionTimestamp = '2026-02-12T06:39:56.237389Z';
const secondLikeReactionTimestamp = '2026-02-12T06:39:52.237389Z';
const heartReactionTimestamp = '2026-02-12T06:35:58.021196Z';

export const reactionsPreviewMessage: LocalMessage = {
  created_at: new Date('2026-02-12T06:34:40.000000Z'),
  deleted_at: null,
  id: 'settings-preview-message-id',
  latest_reactions: [
    {
      created_at: fireReactionTimestamp,
      message_id: 'settings-preview-message-id',
      score: 1,
      type: 'fire',
      updated_at: fireReactionTimestamp,
      user: {
        id: 'test-user',
        language: '',
        role: 'user',
        teams: [],
      },
      user_id: 'test-user',
    },
    {
      created_at: firstLikeReactionTimestamp,
      message_id: 'settings-preview-message-id',
      score: 1,
      type: 'like',
      updated_at: firstLikeReactionTimestamp,
      user: {
        id: 'test-user',
        language: '',
        role: 'user',
        teams: [],
      },
      user_id: 'test-user',
    },
    {
      created_at: secondLikeReactionTimestamp,
      message_id: 'settings-preview-message-id',
      score: 1,
      type: 'like',
      updated_at: secondLikeReactionTimestamp,
      user: {
        id: 'test-user-2',
        language: '',
        role: 'user',
        teams: [],
      },
      user_id: 'test-user-2',
    },
    {
      created_at: heartReactionTimestamp,
      message_id: 'settings-preview-message-id',
      score: 1,
      type: 'heart',
      updated_at: heartReactionTimestamp,
      user: { id: 'test-user-2' },
      user_id: 'test-user-2',
    },
  ] as LocalMessage['latest_reactions'],
  own_reactions: [
    {
      created_at: fireReactionTimestamp,
      message_id: 'settings-preview-message-id',
      score: 1,
      type: 'fire',
      updated_at: fireReactionTimestamp,
      user: { id: 'test-user' },
      user_id: 'test-user',
    },
    {
      created_at: firstLikeReactionTimestamp,
      message_id: 'settings-preview-message-id',
      score: 1,
      type: 'like',
      updated_at: firstLikeReactionTimestamp,
      user: { id: 'test-user' },
      user_id: 'test-user',
    },
    {
      created_at: heartReactionTimestamp,
      message_id: 'settings-preview-message-id',
      score: 1,
      type: 'heart',
      updated_at: heartReactionTimestamp,
      user: { id: 'test-user' },
      user_id: 'test-user',
    },
  ] as LocalMessage['own_reactions'],
  pinned_at: null,
  reaction_counts: { fire: 1, heart: 1, like: 2 },
  reaction_groups: {
    fire: {
      count: 1,
      first_reaction_at: fireReactionTimestamp,
      last_reaction_at: fireReactionTimestamp,
      sum_scores: 1,
    },
    heart: {
      count: 1,
      first_reaction_at: heartReactionTimestamp,
      last_reaction_at: heartReactionTimestamp,
      sum_scores: 1,
    },
    like: {
      count: 2,
      first_reaction_at: secondLikeReactionTimestamp,
      last_reaction_at: firstLikeReactionTimestamp,
      sum_scores: 2,
    },
  } as LocalMessage['reaction_groups'],
  reaction_scores: { fire: 1, heart: 1, like: 2 },
  status: 'received',
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed lectus nibh, rutrum in risus eget, dictum commodo dolor. Donec augue nisi, sollicitudin sed magna ut, tincidunt pretium lorem. ',
  type: 'regular',
  updated_at: new Date('2026-02-12T06:40:00.000000Z'),
  user: {
    id: 'settings-preview-user',
    image: 'https://getstream.io/random_svg/?id=preview-user&name=Preview+User',
    name: 'Preview User',
  },
};

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
  addNotification: () => undefined,
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
