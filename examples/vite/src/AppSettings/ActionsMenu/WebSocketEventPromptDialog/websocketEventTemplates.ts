import type {
  Channel,
  ChannelMemberResponse,
  ChannelResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';

type JsonObject = Record<string, unknown>;
type DebugUserResponse = UserResponse & { invisible?: boolean };
type DebugChannelResponse = ChannelResponse & { name?: string };

export const supportedWebsocketEventTypes = [
  'ai_indicator.clear',
  'ai_indicator.stop',
  'ai_indicator.update',
  'channel.created',
  'channel.deleted',
  'channel.hidden',
  'channel.kicked',
  'channel.muted',
  'channel.truncated',
  'channel.unmuted',
  'channel.updated',
  'channel.visible',
  'draft.deleted',
  'draft.updated',
  'health.check',
  'live_location_sharing.started',
  'live_location_sharing.stopped',
  'member.added',
  'member.removed',
  'member.updated',
  'message.deleted',
  'message.delivered',
  'message.new',
  'message.read',
  'message.updated',
  'message.undeleted',
  'notification.added_to_channel',
  'notification.channel_deleted',
  'notification.channel_mutes_updated',
  'notification.channel_truncated',
  'notification.invite_accepted',
  'notification.invite_rejected',
  'notification.invited',
  'notification.mark_read',
  'notification.mark_unread',
  'notification.message_new',
  'notification.mutes_updated',
  'notification.reminder_due',
  'notification.removed_from_channel',
  'notification.thread_message_new',
  'poll.closed',
  'poll.updated',
  'poll.vote_casted',
  'poll.vote_changed',
  'poll.vote_removed',
  'reaction.deleted',
  'reaction.new',
  'reaction.updated',
  'reminder.created',
  'reminder.deleted',
  'reminder.updated',
  'thread.updated',
  'typing.start',
  'typing.stop',
  'user.banned',
  'user.deleted',
  'user.messages.deleted',
  'user.presence.changed',
  'user.unbanned',
  'user.unread_message_reminder',
  'user.updated',
  'user.watching.start',
  'user.watching.stop',
] as const;

export type SupportedWebsocketEventType = (typeof supportedWebsocketEventTypes)[number];

export type WebSocketEventTemplateDefinition = {
  buildDefault: (context: WebSocketEventTemplateContext) => JsonObject;
  description: string;
  todo?: string;
};

export type WebSocketEventPresetOption = {
  description: string;
  eventType: SupportedWebsocketEventType;
  id: string;
  label: string;
};

export type WebSocketEventTemplateContext = {
  actor: DebugUserResponse;
  actorMember: ChannelMemberResponse;
  actorId: string;
  channel: DebugChannelResponse;
  channelMembers: ChannelMemberResponse[];
  channelId: string;
  channelName: string;
  channelType: string;
  cid: string;
  createdAt: string;
  lastReadAt: string;
  memberCount: number;
  messageId: string;
  otherMember: ChannelMemberResponse;
  otherUser: DebugUserResponse;
  parentMessageId: string;
  pollId: string;
  reactionType: string;
  reminderId: string;
  unreadChannels: number;
  unreadCount: number;
  watcherCount: number;
};

type BuildChannelSeedContext = Omit<WebSocketEventTemplateContext, 'channel'> & {
  channel: Partial<DebugChannelResponse>;
};

const createFallbackUser = (id: string, createdAt: string): DebugUserResponse => ({
  banned: false,
  blocked_user_ids: [],
  created_at: createdAt,
  id,
  invisible: false,
  language: '',
  last_active: createdAt,
  name: id,
  online: true,
  role: 'user',
  shadow_banned: false,
  teams: [],
  updated_at: createdAt,
});

const getUserId = (user: DebugUserResponse) =>
  typeof user.id === 'string' ? user.id : 'debug-user';

const createMember = (user: DebugUserResponse): ChannelMemberResponse => {
  const createdAt =
    typeof user.created_at === 'string' ? user.created_at : new Date().toISOString();

  return {
    banned: false,
    channel_role: 'channel_member',
    created_at: createdAt,
    notifications_muted: false,
    role: 'member',
    shadow_banned: false,
    status: 'member',
    updated_at: createdAt,
    user,
    user_id: getUserId(user),
  };
};

const getMemberUserId = (member: { user?: unknown; user_id?: unknown }) => {
  if (typeof member.user_id === 'string') {
    return member.user_id;
  }

  const { user } = member;
  if (!user || typeof user !== 'object' || !('id' in user)) {
    return undefined;
  }

  return typeof user.id === 'string' ? user.id : undefined;
};

const buildChannel = (
  context: BuildChannelSeedContext,
  overrides: JsonObject = {},
): DebugChannelResponse => {
  const createdAt = context.createdAt;

  return {
    cid: context.cid,
    config: {
      automod: 'disabled',
      blocklist_behavior: 'flag',
      commands: [
        {
          args: '[@username] [text]',
          description: 'Ban a user',
          name: 'ban',
          set: 'moderation_set',
        },
        {
          args: '[@username]',
          description: 'Unban a user',
          name: 'unban',
          set: 'moderation_set',
        },
        {
          args: '[@username]',
          description: 'Mute a user',
          name: 'mute',
          set: 'moderation_set',
        },
        {
          args: '[@username]',
          description: 'Unmute a user',
          name: 'unmute',
          set: 'moderation_set',
        },
        {
          args: '[text]',
          description: 'Post a random gif to the channel',
          name: 'giphy',
          set: 'fun_set',
        },
      ],
      connect_events: true,
      count_messages: false,
      created_at: createdAt,
      custom_events: true,
      delivery_events: true,
      mark_messages_pending: false,
      max_message_length: 5000,
      message_retention: 'infinite',
      mutes: true,
      name: context.channelType,
      polls: true,
      push_level: 'all',
      push_notifications: true,
      quotes: true,
      reactions: true,
      read_events: true,
      reminders: true,
      replies: true,
      search: true,
      shared_locations: true,
      skip_last_msg_update_for_system_msgs: false,
      typing_events: true,
      updated_at: createdAt,
      uploads: true,
      url_enrichment: true,
      user_message_reminders: true,
    },
    created_at: createdAt,
    created_by: context.actor,
    disabled: false,
    frozen: false,
    hidden: false,
    id: context.channelId,
    last_message_at: createdAt,
    member_count: context.memberCount,
    members: context.channelMembers,
    name: context.channelName,
    type: context.channelType,
    updated_at: createdAt,
    ...overrides,
  };
};

const buildMe = (
  context: WebSocketEventTemplateContext,
  overrides: JsonObject = {},
): JsonObject => ({
  ...context.actor,
  channel_mutes: [],
  devices: [],
  invisible:
    typeof context.actor.invisible === 'boolean' ? context.actor.invisible : false,
  mutes: [],
  total_unread_count: 0,
  unread_channels: 0,
  unread_count: 0,
  unread_threads: 0,
  ...overrides,
});

const buildNotificationChannelMutesUpdatedPayload = (
  context: WebSocketEventTemplateContext,
  channelMutes: JsonObject[],
) => ({
  created_at: context.createdAt,
  me: buildMe(context, {
    channel_mutes: channelMutes,
  }),
  type: 'notification.channel_mutes_updated',
});

const buildMuteEntry = (
  context: WebSocketEventTemplateContext,
  target: DebugUserResponse = context.otherUser,
  overrides: JsonObject = {},
): JsonObject => ({
  created_at: context.createdAt,
  target,
  updated_at: context.createdAt,
  user: context.actor,
  ...overrides,
});

const buildNotificationMutesUpdatedPayload = (
  context: WebSocketEventTemplateContext,
  mutes: JsonObject[],
) => ({
  created_at: context.createdAt,
  me: buildMe(context, {
    channel_mutes: [],
    mutes,
  }),
  type: 'notification.mutes_updated',
});

const buildReminderPayload = (
  context: WebSocketEventTemplateContext,
  overrides: JsonObject = {},
): JsonObject => ({
  channel: buildChannel(context),
  channel_cid: context.cid,
  created_at: context.createdAt,
  message: buildMessage(context, {
    html: '',
    member: undefined,
    poll: buildPollWithAnswerComment(context, 'Some new comment X'),
    poll_id: context.pollId,
    text: '',
    updated_at: context.createdAt,
    user: context.otherUser,
  }),
  message_id: context.messageId,
  remind_at: null,
  updated_at: context.createdAt,
  user: context.actor,
  user_id: context.actorId,
  ...overrides,
});

const buildMessageReminderSummary = (
  context: WebSocketEventTemplateContext,
  overrides: JsonObject = {},
): JsonObject => ({
  channel_cid: context.cid,
  created_at: context.createdAt,
  message_id: context.messageId,
  remind_at: null,
  updated_at: context.createdAt,
  user_id: context.actorId,
  ...overrides,
});

const buildBaseEvent = (
  context: WebSocketEventTemplateContext,
  type: SupportedWebsocketEventType,
  overrides: JsonObject = {},
): JsonObject => ({
  channel_id: context.channelId,
  channel_type: context.channelType,
  cid: context.cid,
  created_at: context.createdAt,
  type,
  ...overrides,
});

const buildMessage = (
  context: WebSocketEventTemplateContext,
  overrides: JsonObject = {},
): JsonObject => ({
  attachments: [],
  cid: context.cid,
  created_at: context.createdAt,
  deleted_reply_count: 0,
  html: '<p>Debug websocket event payload</p>\n',
  id: context.messageId,
  latest_reactions: [],
  member: context.actorMember,
  mentioned_channel: false,
  mentioned_here: false,
  mentioned_users: [],
  own_reactions: [],
  pinned: false,
  pinned_at: null,
  pinned_by: null,
  pin_expires: null,
  reaction_counts: {},
  reaction_groups: {},
  reaction_scores: {},
  reply_count: 0,
  restricted_visibility: [],
  shadowed: false,
  silent: false,
  text: 'Debug websocket event payload',
  type: 'regular',
  updated_at: context.createdAt,
  user: context.actor,
  ...overrides,
});

const buildReaction = (
  context: WebSocketEventTemplateContext,
  overrides: JsonObject = {},
): JsonObject => ({
  created_at: context.createdAt,
  message_id: context.messageId,
  score: 1,
  type: context.reactionType,
  updated_at: context.createdAt,
  user: context.actor,
  user_id: context.actorId,
  ...overrides,
});

const buildReactionState = ({
  latestReactions,
  reactionType,
  score,
  timestamp,
}: {
  latestReactions: JsonObject[];
  reactionType: string;
  score: number;
  timestamp: string;
}): JsonObject => ({
  latest_reactions: latestReactions,
  reaction_counts: {
    [reactionType]: latestReactions.length,
  },
  reaction_groups: {
    [reactionType]: {
      count: latestReactions.length,
      first_reaction_at: timestamp,
      last_reaction_at: timestamp,
      latest_reactions_by: [],
      sum_scores: latestReactions.length * score,
    },
  },
  reaction_scores: {
    [reactionType]: latestReactions.length * score,
  },
});

const buildPollOptions = () =>
  Array.from({ length: 12 }, (_, index) => ({
    id: `debug-poll-option-${index + 1}`,
    text: `Option ${index + 1}`,
  }));

const buildPollVote = (
  context: WebSocketEventTemplateContext,
  optionId: string,
): JsonObject => ({
  created_at: context.createdAt,
  id: `debug-poll-vote-${Date.now()}`,
  option_id: optionId,
  poll_id: context.pollId,
  updated_at: context.createdAt,
  user: context.actor,
  user_id: context.actorId,
});

const buildPollAnswerVote = (
  context: WebSocketEventTemplateContext,
  answerText: string,
  overrides: JsonObject = {},
): JsonObject => ({
  answer_text: answerText,
  created_at: context.createdAt,
  id: `debug-poll-answer-${Date.now()}`,
  is_answer: true,
  option_id: '',
  poll_id: context.pollId,
  updated_at: context.createdAt,
  user: context.actor,
  user_id: context.actorId,
  ...overrides,
});

const buildPoll = (
  context: WebSocketEventTemplateContext,
  overrides: JsonObject = {},
): JsonObject => {
  const options = buildPollOptions();
  const firstOptionId = options[0]?.id ?? 'debug-poll-option-1';
  const ownVote = buildPollVote(context, firstOptionId);

  return {
    allow_answers: true,
    allow_user_suggested_options: true,
    answers_count: 0,
    created_at: context.createdAt,
    created_by: context.otherUser,
    created_by_id:
      typeof context.otherUser.id === 'string'
        ? context.otherUser.id
        : 'debug-poll-author',
    description: '',
    enforce_unique_vote: false,
    id: context.pollId,
    latest_answers: [],
    latest_votes_by_option: {},
    max_votes_allowed: 10,
    name: 'Test Poll',
    options,
    own_votes: [ownVote],
    updated_at: context.createdAt,
    vote_count: 1,
    vote_counts_by_option: {
      [firstOptionId]: 1,
    },
    voting_visibility: 'anonymous',
    ...overrides,
  };
};

const buildClosedPoll = (context: WebSocketEventTemplateContext): JsonObject => ({
  allow_answers: false,
  allow_user_suggested_options: false,
  answers_count: 0,
  created_at: context.lastReadAt,
  created_by: context.actor,
  created_by_id: context.actorId,
  description: '',
  enforce_unique_vote: true,
  id: context.pollId,
  is_closed: true,
  latest_answers: [],
  latest_votes_by_option: {},
  max_votes_allowed: null,
  name: 'Asking a question',
  options: [
    {
      id: 'debug-poll-option-1',
      text: 'Option1',
    },
    {
      id: 'debug-poll-option-2',
      text: 'Option2',
    },
  ],
  own_votes: [],
  updated_at: context.createdAt,
  vote_count: 0,
  vote_counts_by_option: {},
  voting_visibility: 'public',
});

const getPollOptionId = (poll: JsonObject) =>
  Array.isArray(poll.options) &&
  poll.options[0] &&
  typeof poll.options[0] === 'object' &&
  poll.options[0] &&
  'id' in poll.options[0] &&
  typeof poll.options[0].id === 'string'
    ? poll.options[0].id
    : 'debug-poll-option-1';

const buildPollWithAnswerComment = (
  context: WebSocketEventTemplateContext,
  answerText: string,
) => {
  const answerCreatedAt = new Date(Date.now() - 60_000).toISOString();
  const pollVote = buildPollAnswerVote(context, answerText, {
    created_at: answerCreatedAt,
    updated_at: context.createdAt,
  });

  return buildPoll(context, {
    answers_count: 1,
    latest_answers: [pollVote],
    options: [
      ...buildPollOptions(),
      {
        id: 'debug-poll-option-13',
        text: 'New option',
      },
    ],
    own_votes: [
      {
        answer_text: answerText,
        created_at: answerCreatedAt,
        id:
          typeof pollVote.id === 'string'
            ? pollVote.id
            : `debug-poll-answer-${Date.now()}`,
        is_answer: true,
        option_id: '',
        poll_id: context.pollId,
        updated_at: context.createdAt,
        user: context.actor,
        user_id: context.actorId,
      },
    ],
    updated_at: context.createdAt,
    vote_count: 0,
    vote_counts_by_option: {},
  });
};

const buildMessageUpdatedPinnedPayload = (context: WebSocketEventTemplateContext) =>
  buildBaseEvent(context, 'message.updated', {
    channel_custom: {
      name: context.channelName,
    },
    channel_member_count: context.memberCount,
    message: buildMessage(context, {
      html: '',
      member: undefined,
      pinned: true,
      pinned_at: context.createdAt,
      pinned_by: context.actor,
      poll: buildPollWithAnswerComment(context, 'Some new comment X'),
      poll_id: context.pollId,
      text: '',
      updated_at: context.createdAt,
      user: context.otherUser,
    }),
    message_id: context.messageId,
    message_update: {
      change_set: {
        attachments: false,
        custom: false,
        html: false,
        mentioned_user_ids: false,
        mml: false,
        pin: true,
        quoted_message_id: false,
        silent: false,
        text: false,
      },
    },
    user: context.actor,
  });

const buildMessageUpdatedUnpinnedPayload = (context: WebSocketEventTemplateContext) =>
  buildBaseEvent(context, 'message.updated', {
    channel_custom: {
      name: context.channelName,
    },
    channel_member_count: context.memberCount,
    message: buildMessage(context, {
      html: '',
      member: undefined,
      pinned: false,
      pinned_at: null,
      pinned_by: null,
      poll: buildPollWithAnswerComment(context, 'Some new comment X'),
      poll_id: context.pollId,
      text: '',
      updated_at: context.createdAt,
      user: context.otherUser,
    }),
    message_id: context.messageId,
    message_update: {
      change_set: {
        attachments: false,
        custom: false,
        html: false,
        mentioned_user_ids: false,
        mml: false,
        pin: true,
        quoted_message_id: false,
        silent: false,
        text: false,
      },
    },
    user: context.actor,
  });

const buildChannelUpdatedEvent = (
  context: WebSocketEventTemplateContext,
  channelOverrides: JsonObject = {},
  eventOverrides: JsonObject = {},
) =>
  buildBaseEvent(context, 'channel.updated', {
    channel: buildChannel(context, channelOverrides),
    channel_member_count:
      typeof channelOverrides.member_count === 'number'
        ? channelOverrides.member_count
        : context.memberCount,
    user: context.actor,
    ...eventOverrides,
  });

const buildChannelUpdatedRemovedMemberPayload = (
  context: WebSocketEventTemplateContext,
) => {
  const nextMembers = context.channelMembers.filter(
    (member) => getMemberUserId(member) !== getMemberUserId(context.otherMember),
  );
  const nextMemberCount = Math.max(context.memberCount - 1, 0);

  return buildChannelUpdatedEvent(
    context,
    {
      member_count: nextMemberCount,
      members: nextMembers,
    },
    {
      channel_member_count: nextMemberCount,
    },
  );
};

const buildChannelUpdatedDisabledPayload = (
  context: WebSocketEventTemplateContext,
  disabled: boolean,
) =>
  buildChannelUpdatedEvent(context, {
    disabled,
  });

const buildChannelUpdatedFrozenPayload = (
  context: WebSocketEventTemplateContext,
  frozen: boolean,
) =>
  buildChannelUpdatedEvent(context, {
    frozen,
  });

const buildChannelUpdatedRenamedPayload = (context: WebSocketEventTemplateContext) => {
  const nextName = `${context.channelName} (updated)`;

  return buildChannelUpdatedEvent(
    context,
    {
      name: nextName,
    },
    {
      channel_custom: { name: nextName },
    },
  );
};

const buildMemberUpdatedPayload = (
  context: WebSocketEventTemplateContext,
  memberOverrides: JsonObject = {},
) =>
  buildBaseEvent(context, 'member.updated', {
    channel: buildChannel(context),
    channel_member_count: context.memberCount,
    member: {
      ...context.actorMember,
      updated_at: context.createdAt,
      ...memberOverrides,
    },
    user: context.actor,
  });

const createTodoTemplate = (
  description: string,
  todo: string,
): WebSocketEventTemplateDefinition => ({
  buildDefault: () => ({}),
  description,
  todo,
});

export const createWebSocketEventTemplateContext = ({
  channel,
  client,
}: {
  channel?: Channel;
  client: StreamChat;
}): WebSocketEventTemplateContext => {
  const createdAt = new Date().toISOString();
  const actorUser =
    client.user && typeof client.user === 'object'
      ? ({ ...client.user } as DebugUserResponse)
      : createFallbackUser('debug-user', createdAt);
  const actorId = typeof actorUser.id === 'string' ? actorUser.id : 'debug-user';

  const members = channel ? Object.values(channel.state.members) : [];
  const actorMemberFromChannel = members.find(
    (member) => getMemberUserId(member) === actorId,
  );
  const actorMember = actorMemberFromChannel
    ? ({ ...actorMemberFromChannel } as ChannelMemberResponse)
    : createMember(actorUser);

  const otherMemberFromChannel = members.find(
    (member) => getMemberUserId(member) !== actorId,
  );
  const otherUser =
    otherMemberFromChannel?.user && typeof otherMemberFromChannel.user === 'object'
      ? ({ ...otherMemberFromChannel.user } as DebugUserResponse)
      : createFallbackUser('debug-other-user', createdAt);
  const otherMember = otherMemberFromChannel
    ? ({ ...otherMemberFromChannel } as ChannelMemberResponse)
    : createMember(otherUser);
  const channelMembers = (
    members.length
      ? members.map((member) => ({ ...member }) as ChannelMemberResponse)
      : [actorMember, otherMember]
  ) as ChannelMemberResponse[];

  const channelData = channel?.data as
    | {
        frozen?: boolean;
        hidden?: boolean;
        name?: string;
      }
    | undefined;

  const channelType = channel?.type ?? 'messaging';
  const channelId = channel?.id ?? 'debug';
  const cid = channel?.cid ?? `${channelType}:${channelId}`;
  const channelName = channelData?.name ?? channelId;
  const memberCount = members.length || 2;
  const watcherCount =
    Object.keys(channel?.state.watchers ?? {}).length || Math.max(memberCount, 1);
  const unreadCount = channel?.state.unreadCount ?? 1;

  return {
    actor: actorUser,
    actorId,
    actorMember,
    channel: buildChannel(
      {
        actor: actorUser,
        actorId,
        actorMember,
        channel: {},
        channelMembers,
        channelId,
        channelName,
        channelType,
        cid,
        createdAt,
        lastReadAt: createdAt,
        memberCount,
        messageId: 'debug-message-id',
        otherMember,
        otherUser,
        parentMessageId: 'debug-parent-message-id',
        pollId: 'debug-poll-id',
        reactionType: 'love',
        reminderId: 'debug-reminder-id',
        unreadChannels: 1,
        unreadCount,
        watcherCount,
      },
      {
        frozen: channelData?.frozen ?? false,
        hidden: channelData?.hidden ?? false,
      },
    ),
    channelId,
    channelMembers,
    channelName,
    channelType,
    cid,
    createdAt,
    lastReadAt: createdAt,
    memberCount,
    messageId: `debug-message-${Date.now()}`,
    otherMember,
    otherUser,
    parentMessageId: `debug-parent-${Date.now()}`,
    pollId: `debug-poll-${Date.now()}`,
    reactionType: 'love',
    reminderId: `debug-reminder-${Date.now()}`,
    unreadChannels: 1,
    unreadCount,
    watcherCount,
  };
};

export const websocketEventTemplateDefinitions = {
  'ai_indicator.clear': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'ai_indicator.clear', {
        user: context.actor,
      }),
    description: 'Clear an AI indicator for the active channel.',
  },
  'ai_indicator.stop': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'ai_indicator.stop', {
        user: context.actor,
      }),
    description: 'Stop an AI indicator for the active channel.',
  },
  'ai_indicator.update': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'ai_indicator.update', {
        ai_message: 'Debug AI indicator payload',
        ai_state: 'thinking',
        user: context.actor,
      }),
    description: 'Update the AI indicator for the active channel.',
  },
  'channel.created': createTodoTemplate(
    'Channel creation event.',
    'Populate with a realistic channel.created payload after validating the example flow.',
  ),
  'channel.deleted': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'channel.deleted', {
        channel: buildChannel(context),
      }),
    description: 'Delete the active channel locally.',
  },
  'channel.hidden': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'channel.hidden', {
        channel: buildChannel(context, { blocked: false, hidden: true }),
        clear_history: false,
      }),
    description: 'Hide the active channel.',
  },
  'channel.kicked': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'channel.kicked', {
        user: context.actor,
      }),
    description: 'Simulate the current user being kicked from the active channel.',
  },
  'channel.muted': createTodoTemplate(
    'Channel mute state update.',
    'Populate after validating the expected notification/channel mute payload shape.',
  ),
  'channel.truncated': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'channel.truncated', {
        channel: buildChannel(context, { truncated_at: context.createdAt }),
      }),
    description: 'Truncate the active channel history.',
  },
  'channel.unmuted': createTodoTemplate(
    'Channel unmute state update.',
    'Populate after validating the expected notification/channel mute payload shape.',
  ),
  'channel.updated': {
    buildDefault: (context) => buildChannelUpdatedRenamedPayload(context),
    description: 'Update the active channel details.',
  },
  'channel.visible': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'channel.visible', {
        channel: buildChannel(context, { blocked: false, hidden: false }),
      }),
    description: 'Show the active channel again.',
  },
  'draft.deleted': createTodoTemplate(
    'Draft deletion event.',
    'Populate after validating draft.deleted websocket payloads from the backend.',
  ),
  'draft.updated': createTodoTemplate(
    'Draft creation or update event.',
    'Populate after validating draft.updated websocket payloads from the backend.',
  ),
  'health.check': createTodoTemplate(
    'Connection health check event.',
    'Populate after validating the full me payload returned by connection health checks.',
  ),
  'live_location_sharing.started': createTodoTemplate(
    'Live location sharing started event.',
    'Populate after validating live location event payloads from the backend.',
  ),
  'live_location_sharing.stopped': createTodoTemplate(
    'Live location sharing stopped event.',
    'Populate after validating live location event payloads from the backend.',
  ),
  'member.added': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'member.added', {
        member: context.otherMember,
        user: context.otherUser,
      }),
    description: 'Add another member to the active channel.',
  },
  'member.removed': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'member.removed', {
        member: context.otherMember,
        user: context.otherUser,
      }),
    description: 'Remove another member from the active channel.',
  },
  'member.updated': {
    buildDefault: (context) =>
      buildMemberUpdatedPayload(context, {
        archived_at: context.createdAt,
      }),
    description:
      'Update a channel member, for example when their membership is archived.',
  },
  'message.deleted': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'message.deleted', {
        hard_delete: false,
        message: buildMessage(context, {
          text: 'Deleted message payload',
          type: 'deleted',
        }),
        user: context.actor,
      }),
    description: 'Delete a message in the active channel.',
  },
  'message.delivered': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'message.delivered', {
        channel_custom: { name: context.channelName },
        channel_member_count: context.memberCount,
        last_delivered_at: context.createdAt.replace(/\.\d+Z$/, 'Z'),
        last_delivered_message_id: context.messageId,
        user: context.otherUser,
      }),
    description: 'Confirm delivery of the latest message for another user.',
  },
  'message.new': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'message.new', {
        channel_custom: { name: context.channelName },
        channel_member_count: context.memberCount,
        message: buildMessage(context),
        message_id: context.messageId,
        total_unread_count: context.unreadCount,
        unread_channels: context.unreadChannels,
        unread_count: context.unreadCount,
        user: context.actor,
        watcher_count: context.watcherCount,
      }),
    description: 'Insert a new message into the active channel.',
  },
  'message.read': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'message.read', {
        channel_custom: { name: context.channelName },
        channel_member_count: context.memberCount,
        last_read_message_id: context.messageId,
        user: context.actor,
      }),
    description: 'Mark the active channel as read for the current user.',
  },
  'message.updated': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'message.updated', {
        message: buildMessage(context, {
          html: '<p>Updated websocket event payload</p>\n',
          text: 'Updated websocket event payload',
          updated_at: context.createdAt,
        }),
        user: context.actor,
      }),
    description: 'Update a message in the active channel.',
  },
  'message.undeleted': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'message.undeleted', {
        message: buildMessage(context, {
          text: 'Restored websocket event payload',
        }),
        user: context.actor,
      }),
    description: 'Restore a deleted message in the active channel.',
  },
  'notification.added_to_channel': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'notification.added_to_channel', {
        channel: buildChannel(context),
        channel_member_count: context.memberCount,
        member: context.otherMember,
        total_unread_count: 0,
        unread_channels: 0,
        unread_count: 0,
      }),
    description: 'Notify the current user that they were added to a channel.',
  },
  'notification.channel_deleted': createTodoTemplate(
    'Channel deleted notification event.',
    'Populate after validating notification.channel_deleted payloads from the backend.',
  ),
  'notification.channel_mutes_updated': {
    buildDefault: (context) =>
      buildNotificationChannelMutesUpdatedPayload(context, [
        {
          channel: buildChannel(context, {
            message_count: 0,
          }),
          created_at: context.createdAt,
          updated_at: context.createdAt,
          user: context.actor,
        },
      ]),
    description: 'Update the current user channel mute list.',
  },
  'notification.channel_truncated': createTodoTemplate(
    'Channel truncated notification event.',
    'Populate after validating notification.channel_truncated payloads from the backend.',
  ),
  'notification.invite_accepted': createTodoTemplate(
    'Invite accepted notification event.',
    'Populate after validating notification.invite_accepted payloads from the backend.',
  ),
  'notification.invite_rejected': createTodoTemplate(
    'Invite rejected notification event.',
    'Populate after validating notification.invite_rejected payloads from the backend.',
  ),
  'notification.invited': createTodoTemplate(
    'Channel invited notification event.',
    'Populate after validating notification.invited payloads from the backend.',
  ),
  'notification.mark_read': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'notification.mark_read', {
        channel: buildChannel(context),
        channel_member_count: context.memberCount,
        last_read_message_id: context.messageId,
        total_unread_count: 0,
        unread_channels: 0,
        unread_count: 0,
        unread_thread_messages: null,
        unread_threads: null,
        user: context.actor,
      }),
    description: 'Reset global unread counts for the current user.',
  },
  'notification.mark_unread': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'notification.mark_unread', {
        channel_custom: { name: context.channelName },
        channel_member_count: context.memberCount,
        first_unread_message_id: context.messageId,
        last_read_at: context.lastReadAt,
        last_read_message_id: context.messageId,
        total_unread_count: context.unreadCount,
        unread_channels: context.unreadChannels,
        unread_count: context.unreadCount,
        unread_thread_messages: null,
        unread_threads: 0,
        unread_messages: context.unreadCount,
        user: context.actor,
      }),
    description: 'Mark the current channel unread for the current user.',
  },
  'notification.message_new': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'notification.message_new', {
        channel: buildChannel(context),
        message: buildMessage(context),
        total_unread_count: context.unreadCount,
        unread_channels: context.unreadChannels,
        unread_count: context.unreadCount,
      }),
    description: 'Trigger a message notification for a watched channel.',
  },
  'notification.mutes_updated': {
    buildDefault: (context) =>
      buildNotificationMutesUpdatedPayload(context, [buildMuteEntry(context)]),
    description: 'Update the current user mute list.',
  },
  'notification.reminder_due': createTodoTemplate(
    'Reminder due notification event.',
    'Populate after validating notification.reminder_due payloads from the backend.',
  ),
  'notification.removed_from_channel': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'notification.removed_from_channel', {
        channel: buildChannel(context),
        channel_member_count: context.memberCount,
        member: context.otherMember,
        user: context.otherUser,
      }),
    description: 'Notify that a member was removed from a channel.',
  },
  'notification.thread_message_new': createTodoTemplate(
    'Thread message notification event.',
    'Populate after validating notification.thread_message_new payloads from the backend.',
  ),
  'poll.closed': {
    buildDefault: (context) => ({
      cid: context.cid,
      created_at: context.createdAt,
      message_id: context.messageId,
      poll: buildClosedPoll(context),
      type: 'poll.closed',
    }),
    description: 'Close a poll attached to a message.',
  },
  'poll.updated': {
    buildDefault: (context) => ({
      cid: context.cid,
      created_at: context.createdAt,
      message_id: context.messageId,
      poll: buildPoll(context, {
        options: [
          ...buildPollOptions(),
          {
            id: 'debug-poll-option-13',
            text: 'New option',
          },
        ],
        own_votes: [],
        updated_at: context.createdAt,
        vote_count: 0,
        vote_counts_by_option: {},
      }),
      type: 'poll.updated',
    }),
    description: 'Update a poll, for example when a suggested option is added.',
  },
  'poll.vote_casted': {
    buildDefault: (context) => {
      const poll = buildPoll(context);
      const optionId = getPollOptionId(poll);

      return {
        cid: context.cid,
        created_at: context.createdAt,
        message_id: context.messageId,
        poll,
        poll_vote: buildPollVote(context, optionId),
        type: 'poll.vote_casted',
      };
    },
    description: 'Cast a vote on a poll attached to a message.',
  },
  'poll.vote_changed': {
    buildDefault: (context) => {
      const originalCreatedAt = new Date(Date.now() - 60_000).toISOString();
      const answerText = 'Some new comment X';
      const pollVote = buildPollAnswerVote(context, answerText, {
        created_at: originalCreatedAt,
        updated_at: context.createdAt,
      });

      return {
        cid: context.cid,
        created_at: context.createdAt,
        message_id: context.messageId,
        poll: buildPoll(context, {
          answers_count: 1,
          latest_answers: [pollVote],
          own_votes: [
            {
              answer_text: answerText,
              created_at: originalCreatedAt,
              id:
                typeof pollVote.id === 'string'
                  ? pollVote.id
                  : `debug-poll-answer-${Date.now()}`,
              is_answer: true,
              option_id: '',
              poll_id: context.pollId,
              updated_at: context.createdAt,
              user_id: context.actorId,
            },
          ],
          options: [
            ...buildPollOptions(),
            {
              id: 'debug-poll-option-13',
              text: 'New option',
            },
          ],
          updated_at: context.createdAt,
          vote_count: 0,
          vote_counts_by_option: {},
        }),
        poll_vote: pollVote,
        type: 'poll.vote_changed',
      };
    },
    description: 'Update a poll answer or comment.',
  },
  'poll.vote_removed': {
    buildDefault: (context) => {
      const poll = buildPoll(context, {
        own_votes: [],
        vote_count: 0,
        vote_counts_by_option: {},
      });
      const optionId = getPollOptionId(poll);

      return {
        cid: context.cid,
        created_at: context.createdAt,
        message_id: context.messageId,
        poll,
        poll_vote: buildPollVote(context, optionId),
        type: 'poll.vote_removed',
      };
    },
    description: 'Remove a vote from a poll attached to a message.',
  },
  'reaction.deleted': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'reaction.deleted', {
        channel: context.channel,
        channel_member_count: context.memberCount,
        message: buildMessage(context, {
          ...buildReactionState({
            latestReactions: [buildReaction(context)],
            reactionType: context.reactionType,
            score: 1,
            timestamp: context.createdAt,
          }),
        }),
        message_id: context.messageId,
        reaction: buildReaction(context),
        user: context.actor,
      }),
    description: 'Delete a reaction from a message.',
  },
  'reaction.new': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'reaction.new', {
        channel: context.channel,
        channel_member_count: context.memberCount,
        message: buildMessage(context, {
          ...buildReactionState({
            latestReactions: [buildReaction(context)],
            reactionType: context.reactionType,
            score: 1,
            timestamp: context.createdAt,
          }),
        }),
        message_id: context.messageId,
        reaction: buildReaction(context),
        user: context.actor,
      }),
    description: 'Add a reaction to a message.',
  },
  'reaction.updated': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'reaction.updated', {
        channel: context.channel,
        channel_member_count: context.memberCount,
        message: buildMessage(context, {
          ...buildReactionState({
            latestReactions: [buildReaction(context, { score: 2 })],
            reactionType: context.reactionType,
            score: 2,
            timestamp: context.createdAt,
          }),
        }),
        message_id: context.messageId,
        reaction: buildReaction(context, { score: 2 }),
        user: context.actor,
      }),
    description: 'Update a reaction on a message.',
  },
  'reminder.created': {
    buildDefault: (context) => ({
      cid: context.cid,
      created_at: context.createdAt,
      message_id: context.messageId,
      reminder: buildReminderPayload(context),
      type: 'reminder.created',
      user_id: context.actorId,
    }),
    description: 'Create a reminder for a message.',
  },
  'reminder.deleted': {
    buildDefault: (context) => ({
      cid: context.cid,
      created_at: context.createdAt,
      message_id: context.messageId,
      reminder: buildReminderPayload(context),
      type: 'reminder.deleted',
      user_id: context.actorId,
    }),
    description: 'Remove a reminder from a message.',
  },
  'reminder.updated': createTodoTemplate(
    'Reminder updated event.',
    'Populate after validating reminder.updated payloads from the backend.',
  ),
  'thread.updated': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'thread.updated', {
        thread: {
          active_participant_count: 2,
          created_at: context.createdAt,
          deleted_at: null,
          last_message_at: context.createdAt,
          parent_message_id: context.parentMessageId,
          participant_count: 2,
          reply_count: 3,
          title: 'Debug thread',
          updated_at: context.createdAt,
        },
        user: context.actor,
      }),
    description: 'Update thread details for the active channel.',
  },
  'typing.start': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'typing.start', {
        channel_last_message_at:
          typeof context.channel.last_message_at === 'string'
            ? context.channel.last_message_at
            : context.createdAt,
        user: context.actor,
      }),
    description: 'Start typing in the active channel.',
  },
  'typing.stop': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'typing.stop', {
        channel_last_message_at:
          typeof context.channel.last_message_at === 'string'
            ? context.channel.last_message_at
            : context.createdAt,
        user: context.actor,
      }),
    description: 'Stop typing in the active channel.',
  },
  'user.banned': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'user.banned', {
        channel_custom: { name: context.channelName },
        channel_member_count: context.memberCount,
        created_by: context.actor,
        expiration: new Date(Date.now() + 60 * 60_000).toISOString(),
        reason: 'because',
        user: context.otherUser,
      }),
    description: 'Ban another user from the active channel.',
  },
  'user.deleted': createTodoTemplate(
    'User deleted event.',
    'Populate after validating user.deleted payloads from the backend.',
  ),
  'user.messages.deleted': createTodoTemplate(
    'User messages deleted event.',
    'Populate after validating user.messages.deleted payloads from the backend.',
  ),
  'user.presence.changed': {
    buildDefault: (context) => ({
      created_at: context.createdAt,
      type: 'user.presence.changed',
      user: {
        ...context.actor,
        last_active: context.createdAt,
        online: false,
      },
    }),
    description: 'Change the current user presence state.',
  },
  'user.unbanned': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'user.unbanned', {
        channel_custom: { name: context.channelName },
        channel_member_count: context.memberCount,
        user: context.otherUser,
      }),
    description: 'Unban another user in the active channel.',
  },
  'user.unread_message_reminder': createTodoTemplate(
    'Unread message reminder event.',
    'Populate after validating user.unread_message_reminder payloads from the backend.',
  ),
  'user.updated': {
    buildDefault: (context) => ({
      created_at: context.createdAt,
      type: 'user.updated',
      user: {
        ...context.actor,
        name: 'Updated Debug User',
        updated_at: context.createdAt,
      },
    }),
    description: 'Update the current user object.',
  },
  'user.watching.start': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'user.watching.start', {
        user: context.otherUser,
        watcher_count: context.watcherCount + 1,
      }),
    description: 'Add another watcher to the active channel.',
  },
  'user.watching.stop': {
    buildDefault: (context) =>
      buildBaseEvent(context, 'user.watching.stop', {
        user: context.otherUser,
        watcher_count: Math.max(context.watcherCount - 1, 0),
      }),
    description: 'Remove a watcher from the active channel.',
  },
} satisfies Record<SupportedWebsocketEventType, WebSocketEventTemplateDefinition>;

const compareEventTypesAlphabetically = (
  left: SupportedWebsocketEventType,
  right: SupportedWebsocketEventType,
) => left.localeCompare(right);

const comparePresetOptionsAlphabetically = (
  left: WebSocketEventPresetOption,
  right: WebSocketEventPresetOption,
) => left.label.localeCompare(right.label);

export const readyWebsocketEventTypes = supportedWebsocketEventTypes
  .filter((eventType) => !('todo' in websocketEventTemplateDefinitions[eventType]))
  .sort(compareEventTypesAlphabetically);

export const todoWebsocketEventTypes = supportedWebsocketEventTypes
  .filter((eventType) => 'todo' in websocketEventTemplateDefinitions[eventType])
  .sort(compareEventTypesAlphabetically);

const websocketEventPresetOptionsSource = [
  {
    description: 'Use poll.vote_casted to represent an answer or comment being added.',
    eventType: 'poll.vote_casted',
    id: 'poll.vote_casted.answer',
    label: 'poll.vote_casted: answer/comment',
  },
  {
    description: 'Use message.updated to represent a message being pinned.',
    eventType: 'message.updated',
    id: 'message.updated.pinned',
    label: 'message.updated: pinned',
  },
  {
    description: 'Use message.updated to represent a message being unpinned.',
    eventType: 'message.updated',
    id: 'message.updated.unpinned',
    label: 'message.updated: unpinned',
  },
  {
    description: 'Use notification.channel_mutes_updated to represent a channel mute.',
    eventType: 'notification.channel_mutes_updated',
    id: 'notification.channel_mutes_updated.muted',
    label: 'notification.channel_mutes_updated: muted',
  },
  {
    description: 'Use notification.channel_mutes_updated to represent a channel unmute.',
    eventType: 'notification.channel_mutes_updated',
    id: 'notification.channel_mutes_updated.unmuted',
    label: 'notification.channel_mutes_updated: unmuted',
  },
  {
    description: 'Use notification.mutes_updated to represent muting another user.',
    eventType: 'notification.mutes_updated',
    id: 'notification.mutes_updated.muted',
    label: 'notification.mutes_updated: muted',
  },
  {
    description: 'Use notification.mutes_updated to represent unmuting another user.',
    eventType: 'notification.mutes_updated',
    id: 'notification.mutes_updated.unmuted',
    label: 'notification.mutes_updated: unmuted',
  },
  {
    description: 'Use reminder.created to represent a scheduled reminder.',
    eventType: 'reminder.created',
    id: 'reminder.created.timed',
    label: 'reminder.created: timed',
  },
  {
    description: 'Use reminder.deleted to represent removing a scheduled reminder.',
    eventType: 'reminder.deleted',
    id: 'reminder.deleted.timed',
    label: 'reminder.deleted: timed',
  },
  {
    description: 'Use member.updated to represent a member being archived.',
    eventType: 'member.updated',
    id: 'member.updated.archived',
    label: 'member.updated: archived',
  },
  {
    description: 'Use member.updated to represent a member being pinned.',
    eventType: 'member.updated',
    id: 'member.updated.pinned',
    label: 'member.updated: pinned',
  },
  {
    description: 'Use member.updated to represent a member being unpinned.',
    eventType: 'member.updated',
    id: 'member.updated.unpinned',
    label: 'member.updated: unpinned',
  },
  {
    description: 'Use member.updated to represent a member being unarchived.',
    eventType: 'member.updated',
    id: 'member.updated.unarchived',
    label: 'member.updated: unarchived',
  },
  {
    description: 'Use channel.updated to represent a member being removed.',
    eventType: 'channel.updated',
    id: 'channel.updated.member_removed',
    label: 'channel.updated: member removed',
  },
  {
    description: 'Use channel.updated to mark the channel as disabled.',
    eventType: 'channel.updated',
    id: 'channel.updated.disabled_on',
    label: 'channel.updated: disabled on',
  },
  {
    description: 'Use channel.updated to mark the channel as enabled again.',
    eventType: 'channel.updated',
    id: 'channel.updated.disabled_off',
    label: 'channel.updated: disabled off',
  },
  {
    description: 'Use channel.updated to freeze the channel.',
    eventType: 'channel.updated',
    id: 'channel.updated.frozen_on',
    label: 'channel.updated: frozen on',
  },
  {
    description: 'Use channel.updated to unfreeze the channel.',
    eventType: 'channel.updated',
    id: 'channel.updated.frozen_off',
    label: 'channel.updated: frozen off',
  },
  {
    description: 'Use channel.updated to rename the channel.',
    eventType: 'channel.updated',
    id: 'channel.updated.renamed',
    label: 'channel.updated: renamed',
  },
] as const satisfies readonly WebSocketEventPresetOption[];

export const websocketEventPresetOptions = [...websocketEventPresetOptionsSource].sort(
  comparePresetOptionsAlphabetically,
);

export type WebSocketEventPresetId =
  (typeof websocketEventPresetOptionsSource)[number]['id'];

const websocketEventPresetDefinitions = {
  'message.updated.pinned': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildMessageUpdatedPinnedPayload(context),
  },
  'message.updated.unpinned': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildMessageUpdatedUnpinnedPayload(context),
  },
  'poll.vote_casted.answer': {
    buildDefault: (context: WebSocketEventTemplateContext) => {
      const answerText = 'Some new comment';
      const pollVote = buildPollAnswerVote(context, answerText);

      return {
        cid: context.cid,
        created_at: context.createdAt,
        message_id: context.messageId,
        poll: buildPoll(context, {
          answers_count: 1,
          latest_answers: [pollVote],
          own_votes: [
            {
              answer_text: answerText,
              created_at: context.createdAt,
              id:
                typeof pollVote.id === 'string'
                  ? pollVote.id
                  : `debug-poll-answer-${Date.now()}`,
              is_answer: true,
              option_id: '',
              poll_id: context.pollId,
              updated_at: context.createdAt,
              user_id: context.actorId,
            },
          ],
          updated_at: context.createdAt,
          vote_count: 0,
          vote_counts_by_option: {},
        }),
        poll_vote: pollVote,
        type: 'poll.vote_casted',
      };
    },
  },
  'notification.channel_mutes_updated.muted': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildNotificationChannelMutesUpdatedPayload(context, [
        {
          channel: buildChannel(context, {
            message_count: 0,
          }),
          created_at: context.createdAt,
          updated_at: context.createdAt,
          user: context.actor,
        },
      ]),
  },
  'notification.channel_mutes_updated.unmuted': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildNotificationChannelMutesUpdatedPayload(context, []),
  },
  'notification.mutes_updated.muted': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildNotificationMutesUpdatedPayload(context, [buildMuteEntry(context)]),
  },
  'notification.mutes_updated.unmuted': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildNotificationMutesUpdatedPayload(context, [
        buildMuteEntry(context, context.otherUser, {
          created_at: context.lastReadAt,
          updated_at: context.createdAt,
        }),
      ]),
  },
  'reminder.created.timed': {
    buildDefault: (context: WebSocketEventTemplateContext) => ({
      cid: context.cid,
      created_at: context.createdAt,
      message_id: context.messageId,
      reminder: buildReminderPayload(context, {
        remind_at: new Date(Date.now() + 2 * 60_000).toISOString(),
      }),
      type: 'reminder.created',
      user_id: context.actorId,
    }),
  },
  'reminder.deleted.timed': {
    buildDefault: (context: WebSocketEventTemplateContext) => {
      const remindAt = new Date(Date.now() + 2 * 60_000).toISOString();

      return {
        cid: context.cid,
        created_at: context.createdAt,
        message_id: context.messageId,
        reminder: buildReminderPayload(context, {
          message: buildMessage(context, {
            html: '',
            member: undefined,
            poll: buildPollWithAnswerComment(context, 'Some new comment X'),
            poll_id: context.pollId,
            reminder: buildMessageReminderSummary(context, {
              remind_at: remindAt,
            }),
            text: '',
            updated_at: context.createdAt,
            user: context.otherUser,
          }),
          remind_at: remindAt,
        }),
        type: 'reminder.deleted',
        user_id: context.actorId,
      };
    },
  },
  'member.updated.archived': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildMemberUpdatedPayload(context, {
        archived_at: context.createdAt,
      }),
  },
  'member.updated.pinned': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildMemberUpdatedPayload(context, {
        pinned_at: context.createdAt,
      }),
  },
  'member.updated.unpinned': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildMemberUpdatedPayload(context),
  },
  'member.updated.unarchived': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildMemberUpdatedPayload(context),
  },
  'channel.updated.disabled_off': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildChannelUpdatedDisabledPayload(context, false),
  },
  'channel.updated.disabled_on': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildChannelUpdatedDisabledPayload(context, true),
  },
  'channel.updated.frozen_off': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildChannelUpdatedFrozenPayload(context, false),
  },
  'channel.updated.frozen_on': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildChannelUpdatedFrozenPayload(context, true),
  },
  'channel.updated.member_removed': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildChannelUpdatedRemovedMemberPayload(context),
  },
  'channel.updated.renamed': {
    buildDefault: (context: WebSocketEventTemplateContext) =>
      buildChannelUpdatedRenamedPayload(context),
  },
} satisfies Record<
  WebSocketEventPresetId,
  { buildDefault: (context: WebSocketEventTemplateContext) => JsonObject }
>;

export const buildWebSocketEventPresetDraft = (
  presetId: WebSocketEventPresetId,
  context: WebSocketEventTemplateContext,
) =>
  JSON.stringify(
    websocketEventPresetDefinitions[presetId].buildDefault(context),
    null,
    2,
  );

export const buildWebSocketEventDraft = (
  eventType: SupportedWebsocketEventType,
  context: WebSocketEventTemplateContext,
) =>
  JSON.stringify(
    websocketEventTemplateDefinitions[eventType].buildDefault(context),
    null,
    2,
  );

export const buildInitialWebSocketEventDrafts = (
  context: WebSocketEventTemplateContext,
): Record<SupportedWebsocketEventType, string> => {
  const drafts = {} as Record<SupportedWebsocketEventType, string>;

  supportedWebsocketEventTypes.forEach((eventType) => {
    drafts[eventType] = buildWebSocketEventDraft(eventType, context);
  });

  return drafts;
};
