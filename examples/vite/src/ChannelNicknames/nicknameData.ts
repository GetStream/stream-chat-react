import type { Channel, UserResponse } from 'stream-chat';

/**
 * Channel-specific nicknames.
 *
 * The nickname lives on the **channel member** (`member.nickname`), not on the user — that is what
 * scopes it to a single channel.
 *
 * Writing it is out of scope here. A browser client can only write its own membership
 * (`updateMemberPartial` takes no `user_id`), so nicknames for other people are set server-side —
 * however the integrating app already manages its own data.
 *
 * Everything in this folder only reads that field, and degrades to the plain username when it is
 * absent — so it is inert for members without a nickname.
 *
 * Nothing here patches `stream-chat` or `stream-chat-react`; every hook used is public API.
 */

/** Message custom-data key holding `{ [userId]: displayTextUsedInThisMessage }`. */
export const MENTION_DISPLAY_NAMES_KEY = 'mention_display_names';

export const getMemberNickname = (
  channel: Channel,
  userId: string,
): string | undefined => {
  // Custom member fields sit at the top level of the member object in this SDK version —
  // `ChannelMemberResponse` is `CustomMemberData & { … }`, not a `custom` bag.
  const nickname = channel.state.members?.[userId]?.nickname;

  return typeof nickname === 'string' && nickname.trim() ? nickname.trim() : undefined;
};

/**
 * What a mention of `user` should read as in this channel. This is the string the composer
 * inserts into the message text, so it is also the string the renderer has to match on.
 */
export const getMentionDisplayName = (channel: Channel, user: UserResponse): string =>
  getMemberNickname(channel, user.id) ?? user.name ?? user.id;
