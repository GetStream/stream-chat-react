import { useChannel, useChatContext } from '../../../context';
import { useChannelCapabilities } from '../../Channel/hooks/useChannelCapabilities';
import type { LocalMessage } from 'stream-chat';

export const useMessagePermissions = (
  message: LocalMessage,
  disableQuotedMessages?: boolean,
) => {
  const channel = useChannel();
  const { client } = useChatContext();
  const channelCapabilities = useChannelCapabilities({ cid: channel.cid });

  const isMyMessage = client.userID === message.user?.id;

  // Permission only. Which messages have editable content (no poll, no giphy) is the `edit`
  // action's `isVisible` rule in `defaultMessageActionSet`.
  const canEdit =
    channelCapabilities.has('update-any-message') ||
    (isMyMessage && channelCapabilities.has('update-own-message'));

  const canDelete =
    channelCapabilities.has('delete-any-message') ||
    (isMyMessage && channelCapabilities.has('delete-own-message'));
  const canPin = channelCapabilities.has('pin-message');
  const canFlag = !isMyMessage && channelCapabilities.has('flag-message');
  const canMute = !isMyMessage && channelCapabilities.has('mute-channel');
  const canBlockUser = !isMyMessage;
  const canMarkUnread = !isMyMessage && channelCapabilities.has('read-events');
  const canQuote = !disableQuotedMessages && channelCapabilities.has('quote-message');
  const canReact = channelCapabilities.has('send-reaction');
  const canReply = channelCapabilities.has('send-reply');
  const canSendMessage = channelCapabilities.has('send-message');

  return {
    canBlockUser,
    canDelete,
    canEdit,
    canFlag,
    canMarkUnread,
    canMute,
    canPin,
    canQuote,
    canReact,
    canReply,
    canSendMessage,
    isMyMessage,
  };
};
