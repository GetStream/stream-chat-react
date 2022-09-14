import type { ChatContextValue } from '../../../context/ChatContext';
import { useChatContext } from '../../../context/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useChannelContainerClasses = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  customClasses,
}: Pick<ChatContextValue, 'customClasses'>) => {
  const { useImageFlagEmojisOnWindows } = useChatContext<StreamChatGenerics>('Channel');

  return {
    channelClass: customClasses?.channel ?? 'str-chat-channel str-chat__channel',
    chatClass: customClasses?.chat ?? 'str-chat',
    chatContainerClass: customClasses?.chatContainer ?? 'str-chat__container',
    windowsEmojiClass:
      useImageFlagEmojisOnWindows && navigator.userAgent.match(/Win/)
        ? 'str-chat--windows-flags'
        : '',
  };
};
