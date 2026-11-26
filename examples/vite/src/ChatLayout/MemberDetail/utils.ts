import type { BaseSyntheticEvent } from 'react';
import type { LocalMessage, Channel as StreamChannel } from 'stream-chat';
import { getRenderTextMentionEntities } from 'stream-chat-react';

/**
 * The user behind the clicked mention. Enter or Space targets the message text, not a mention, so
 * it identifies a user only when the message's one mention is a user.
 */
export const getMentionedUserId = (event: BaseSyntheticEvent, message: LocalMessage) => {
  if (event.type === 'keydown') {
    const [mention, ...otherMentions] = getRenderTextMentionEntities(message);
    if (otherMentions.length || mention?.mentionType !== 'user') return undefined;
    return mention.id;
  }
  return (event.target as HTMLElement).closest<HTMLElement>('[data-user-id]')?.dataset
    .userId;
};

// Whether a click asks to open beside the current content: ⌘ on macOS, ctrl elsewhere.
export const isOpenBesideClick = (event: BaseSyntheticEvent) => {
  const nativeEvent = event.nativeEvent as globalThis.MouseEvent | undefined;
  return !!nativeEvent && (nativeEvent.metaKey || nativeEvent.ctrlKey);
};

/**
 * Whether a click opens a member's profile in the secondary slot rather than in a modal: a
 * ⌘/ctrl-click from the main channel's messages or its replies. The slot's `userProfile` binding
 * carries only the user's id, so `ChannelMemberDetailPanel` resolves the member in the main channel;
 * a click from another channel opens the modal, which knows that channel.
 */
export const opensMemberDetailBeside = (
  event: BaseSyntheticEvent,
  channel: StreamChannel,
  mainChannel: StreamChannel | undefined,
) => isOpenBesideClick(event) && channel.cid === mainChannel?.cid;
