import type {
  Channel,
  ChannelMemberResponse,
  Event,
  MessageResponse,
  ReactionResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';

import {
  type SupportedWebsocketEventType,
  type WebSocketEventTemplateContext,
  websocketEventTemplateDefinitions,
} from './websocketEventTemplates';
import type { SimulationState, SimulationUser } from './types';

type UnknownRecord = Record<string, unknown>;
type EventPayload = {
  channel?: Partial<WebSocketEventTemplateContext['channel']>;
  member?: ChannelMemberResponse;
  message?: Partial<MessageResponse>;
  reaction?: ReactionResponse;
  user?: UserResponse;
  [key: string]: unknown;
};

const messageTextFragments = [
  'debug event payload',
  'fresh simulated message',
  'pipeline message',
  'interval event',
  'synthetic chat traffic',
];

const reactionTypes = ['love', 'haha', 'wow', 'like', 'sad'] as const;

const asJsonObject = (value: unknown): UnknownRecord | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as UnknownRecord;
};

const getId = (value: unknown) => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  return undefined;
};

const getUserId = (user: unknown) => getId(asJsonObject(user)?.id);

const getMessageId = (message: unknown) => getId(asJsonObject(message)?.id);

const getMessageUser = (message: unknown) => asJsonObject(asJsonObject(message)?.user);

const getMessageMember = (message: unknown) =>
  asJsonObject(asJsonObject(message)?.member);

const asUserResponse = (value: unknown): UserResponse | undefined => {
  const user = asJsonObject(value);

  return typeof user?.id === 'string' ? (user as unknown as UserResponse) : undefined;
};

const asChannelMemberResponse = (value: unknown): ChannelMemberResponse | undefined => {
  const member = asJsonObject(value);

  if (!member) return undefined;

  const userId = getId(member.user_id) ?? getUserId(member.user);

  return userId ? (member as unknown as ChannelMemberResponse) : undefined;
};

const buildRandomMessageText = (sequence: number) =>
  `${messageTextFragments[sequence % messageTextFragments.length]} #${sequence}`;

const buildReactionState = ({
  reaction,
}: {
  reaction: ReactionResponse;
}): Pick<
  MessageResponse,
  'latest_reactions' | 'reaction_counts' | 'reaction_groups' | 'reaction_scores'
> => {
  const reactionType = getId(reaction.type) ?? 'love';
  const reactionScore =
    typeof reaction.score === 'number' && Number.isFinite(reaction.score)
      ? reaction.score
      : 1;
  const reactionTimestamp = getId(reaction.created_at) ?? new Date().toISOString();

  return {
    latest_reactions: [reaction],
    reaction_counts: {
      [reactionType]: 1,
    },
    reaction_groups: {
      [reactionType]: {
        count: 1,
        first_reaction_at: reactionTimestamp,
        last_reaction_at: reactionTimestamp,
        latest_reactions_by: [],
        sum_scores: reactionScore,
      },
    },
    reaction_scores: {
      [reactionType]: reactionScore,
    },
  } as unknown as Pick<
    MessageResponse,
    'latest_reactions' | 'reaction_counts' | 'reaction_groups' | 'reaction_scores'
  >;
};

const uniquePush = <T extends string>(items: T[], value: T) => {
  if (items.includes(value)) return items;
  return [...items, value];
};

const upsertUser = (users: SimulationUser[], nextUser: SimulationUser) => {
  const existingIndex = users.findIndex((user) => user.id === nextUser.id);

  if (existingIndex === -1) {
    return [...users, nextUser];
  }

  const clonedUsers = [...users];
  clonedUsers[existingIndex] = {
    ...clonedUsers[existingIndex],
    ...nextUser,
  };
  return clonedUsers;
};

const getChannelMembersForCid = (
  cid: string,
  simulationState: SimulationState,
  templateContext: WebSocketEventTemplateContext,
): ChannelMemberResponse[] => {
  const knownMembers = Object.values(simulationState.membersByCid[cid] ?? {});

  if (knownMembers.length > 0) {
    return knownMembers;
  }

  return templateContext.channelMembers;
};

const buildFreshContext = (
  templateContext: WebSocketEventTemplateContext,
  simulationState: SimulationState,
): WebSocketEventTemplateContext => {
  const sequence = simulationState.nextSequence;
  const createdAt = new Date().toISOString();
  const channelMembers = getChannelMembersForCid(
    templateContext.cid,
    simulationState,
    templateContext,
  );
  const memberCount = channelMembers.length || templateContext.memberCount;
  const baseChannel = templateContext.channel;

  return {
    ...templateContext,
    channel: {
      ...baseChannel,
      member_count: memberCount,
      members: channelMembers,
    },
    channelMembers,
    createdAt,
    lastReadAt: createdAt,
    memberCount,
    messageId: `sim-message-${sequence}`,
    parentMessageId: `sim-parent-${sequence}`,
    pollId: `sim-poll-${sequence}`,
    reminderId: `sim-reminder-${sequence}`,
  };
};

const getUsersForCid = (
  cid: string,
  simulationState: SimulationState,
  templateContext: WebSocketEventTemplateContext,
) => {
  const existingUsers = simulationState.usersByCid[cid];

  if (existingUsers?.length) {
    return existingUsers;
  }

  return [
    templateContext.actor as SimulationUser,
    templateContext.otherUser as SimulationUser,
  ];
};

const pickNextUser = (
  simulationState: SimulationState,
  templateContext: WebSocketEventTemplateContext,
) => {
  const cid = templateContext.cid;
  const users = getUsersForCid(cid, simulationState, templateContext);

  const nextIndex = simulationState.nextUserIndexByCid[cid] ?? 0;
  const user =
    users[nextIndex % users.length] ?? (templateContext.actor as SimulationUser);

  simulationState.nextUserIndexByCid[cid] = nextIndex + 1;

  const member =
    simulationState.membersByCid[cid]?.[user.id] ??
    (user.id === getUserId(templateContext.otherUser)
      ? templateContext.otherMember
      : templateContext.actorMember);

  return {
    member,
    user,
  };
};

const pickMessageId = (
  simulationState: SimulationState,
  templateContext: WebSocketEventTemplateContext,
) => {
  const messageIds = simulationState.messageIdsByCid[templateContext.cid];

  if (messageIds?.length) {
    return messageIds[messageIds.length - 1] ?? templateContext.messageId;
  }

  return templateContext.messageId;
};

const pickReactionType = (simulationState: SimulationState) => {
  const reactionType =
    reactionTypes[simulationState.nextReactionTypeIndex % reactionTypes.length] ??
    reactionTypes[0];
  simulationState.nextReactionTypeIndex += 1;
  return reactionType;
};

const registerUserAndMember = ({
  cid,
  member,
  simulationState,
  user,
}: {
  cid: string;
  member?: ChannelMemberResponse;
  simulationState: SimulationState;
  user?: UserResponse;
}) => {
  if (user) {
    const userId = getUserId(user);

    if (userId) {
      simulationState.usersByCid[cid] = upsertUser(
        simulationState.usersByCid[cid] ?? [],
        user as SimulationUser,
      );
    }
  }

  if (member) {
    const memberUserId = getUserId(member.user);

    if (memberUserId) {
      simulationState.membersByCid[cid] = {
        ...(simulationState.membersByCid[cid] ?? {}),
        [memberUserId]: member,
      };
    }
  }
};

export const createInitialSimulationState = ({
  channel,
  templateContext,
}: {
  channel?: Channel;
  templateContext: WebSocketEventTemplateContext;
}): SimulationState => {
  const cid = templateContext.cid;
  const state: SimulationState = {
    membersByCid: {
      [cid]: {},
    },
    messageIdsByCid: {
      [cid]: [],
    },
    nextReactionTypeIndex: 0,
    nextSequence: 1,
    nextUserIndexByCid: {
      [cid]: 0,
    },
    usersByCid: {
      [cid]: [],
    },
  };

  registerUserAndMember({
    cid,
    member: templateContext.actorMember as ChannelMemberResponse,
    simulationState: state,
    user: templateContext.actor as UserResponse,
  });
  registerUserAndMember({
    cid,
    member: templateContext.otherMember,
    simulationState: state,
    user: templateContext.otherUser,
  });

  const channelMembers = channel ? Object.values(channel.state.members) : [];
  channelMembers.forEach((member) => {
    const memberObject = asJsonObject(member);
    const userObject = asJsonObject(memberObject?.user);

    registerUserAndMember({
      cid,
      member: asChannelMemberResponse(memberObject),
      simulationState: state,
      user: asUserResponse(userObject),
    });
  });

  const channelMessages = channel?.state.messages ?? [];

  channelMessages.forEach((message) => {
    const messageObject = asJsonObject(message);
    const messageId = getMessageId(messageObject);

    if (messageId) {
      state.messageIdsByCid[cid] = uniquePush(
        state.messageIdsByCid[cid] ?? [],
        messageId,
      );
    }

    registerUserAndMember({
      cid,
      member: asChannelMemberResponse(getMessageMember(messageObject)),
      simulationState: state,
      user: asUserResponse(getMessageUser(messageObject)),
    });
  });

  return state;
};

export const buildFreshWebSocketEventPayload = ({
  eventType,
  simulationState,
  templateContext,
}: {
  eventType: SupportedWebsocketEventType;
  simulationState: SimulationState;
  templateContext: WebSocketEventTemplateContext;
}): EventPayload => {
  const freshContext = buildFreshContext(templateContext, simulationState);
  const basePayload = websocketEventTemplateDefinitions[eventType].buildDefault(
    freshContext,
  ) as EventPayload;

  switch (eventType) {
    case 'message.new':
    case 'notification.message_new': {
      const { member, user } = pickNextUser(simulationState, freshContext);
      const messageId = freshContext.messageId;
      const text = buildRandomMessageText(simulationState.nextSequence);
      simulationState.nextSequence += 1;

      const baseMessage = asJsonObject(basePayload.message) ?? {};

      return {
        ...basePayload,
        created_at: freshContext.createdAt,
        message: {
          ...baseMessage,
          created_at: freshContext.createdAt,
          html: `<p>${text}</p>\n`,
          id: messageId,
          member,
          text,
          updated_at: freshContext.createdAt,
          user,
        } as unknown as Partial<MessageResponse>,
        message_id: messageId,
        user: eventType === 'message.new' ? user : basePayload.user,
      };
    }
    case 'reaction.new':
    case 'reaction.updated':
    case 'reaction.deleted': {
      const { member, user } = pickNextUser(simulationState, freshContext);
      const messageId = pickMessageId(simulationState, freshContext);
      const baseMessage = asJsonObject(basePayload.message) ?? {};
      const baseReaction = asJsonObject(basePayload.reaction) ?? {};
      const reactionType = pickReactionType(simulationState);
      const reactionScore = eventType === 'reaction.updated' ? 2 : 1;
      const reaction = {
        ...baseReaction,
        created_at: freshContext.createdAt,
        custom: {},
        message_id: messageId,
        type: reactionType,
        updated_at: freshContext.createdAt,
        user,
        user_id: user.id,
        score: reactionScore,
      } as unknown as ReactionResponse;

      return {
        ...basePayload,
        channel: basePayload.channel,
        channel_member_count:
          typeof basePayload.channel_member_count === 'number'
            ? basePayload.channel_member_count
            : freshContext.memberCount,
        created_at: freshContext.createdAt,
        message: {
          ...baseMessage,
          id: messageId,
          member,
          updated_at: freshContext.createdAt,
          user,
          ...buildReactionState({ reaction }),
        } as unknown as Partial<MessageResponse>,
        message_id: messageId,
        reaction,
        user,
      };
    }
    case 'typing.start':
    case 'typing.stop':
    case 'user.watching.start':
    case 'user.watching.stop': {
      const { user } = pickNextUser(simulationState, freshContext);

      return {
        ...basePayload,
        created_at: freshContext.createdAt,
        user,
      };
    }
    case 'message.updated':
    case 'message.deleted':
    case 'message.undeleted': {
      const messageId = pickMessageId(simulationState, freshContext);
      const { member, user } = pickNextUser(simulationState, freshContext);
      const baseMessage = asJsonObject(basePayload.message) ?? {};

      return {
        ...basePayload,
        created_at: freshContext.createdAt,
        message: {
          ...baseMessage,
          id: messageId,
          member,
          updated_at: freshContext.createdAt,
          user,
        } as unknown as Partial<MessageResponse>,
        user,
      };
    }
    case 'message.read':
    case 'notification.mark_unread': {
      const messageId = pickMessageId(simulationState, freshContext);

      return {
        ...basePayload,
        created_at: freshContext.createdAt,
        first_unread_message_id: messageId,
        last_read_at: freshContext.createdAt,
        last_read_message_id: messageId,
      };
    }
    default:
      simulationState.nextSequence += 1;
      return {
        ...basePayload,
        created_at: freshContext.createdAt,
      };
  }
};

export const trackSimulationStateFromPayload = ({
  payload,
  simulationState,
  templateContext,
}: {
  payload: EventPayload;
  simulationState: SimulationState;
  templateContext: WebSocketEventTemplateContext;
}) => {
  const cid = getId(payload.cid) ?? templateContext.cid;
  const message = asJsonObject(payload.message);
  const messageId = getMessageId(message) ?? getId(payload.message_id);

  if (messageId) {
    simulationState.messageIdsByCid[cid] = uniquePush(
      simulationState.messageIdsByCid[cid] ?? [],
      messageId,
    );
  }

  registerUserAndMember({
    cid,
    member: asChannelMemberResponse(payload.member),
    simulationState,
    user: asUserResponse(payload.user),
  });
  registerUserAndMember({
    cid,
    member: asChannelMemberResponse(getMessageMember(message)),
    simulationState,
    user: asUserResponse(getMessageUser(message)),
  });

  const channelObject = asJsonObject(payload.channel);

  if (Array.isArray(channelObject?.members)) {
    simulationState.membersByCid[cid] = {};

    channelObject.members.forEach((memberValue) => {
      const member = asJsonObject(memberValue);

      if (!member) return;

      registerUserAndMember({
        cid,
        member: asChannelMemberResponse(member),
        simulationState,
        user: asUserResponse(member.user),
      });
    });
  }
};

export const emitWebSocketEventPayload = ({
  client,
  eventType,
  payload,
  simulationState,
  templateContext,
}: {
  client: StreamChat;
  eventType: SupportedWebsocketEventType;
  payload: EventPayload;
  simulationState: SimulationState;
  templateContext: WebSocketEventTemplateContext;
}) => {
  const emittedPayload: EventPayload = {
    ...payload,
    type: eventType,
  };

  client.dispatchEvent(emittedPayload as Event);

  trackSimulationStateFromPayload({
    payload: emittedPayload,
    simulationState,
    templateContext,
  });

  return emittedPayload;
};
