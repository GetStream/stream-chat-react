import type { ChatContextValue } from '../../../context/ChatContext';
import { useChatContext } from '../../../context/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useImageFlagEmojisOnWindowsClass = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { useImageFlagEmojisOnWindows } = useChatContext<StreamChatGenerics>('Channel');
  return useImageFlagEmojisOnWindows && navigator.userAgent.match(/Win/)
    ? 'str-chat--windows-flags'
    : '';
};

export const getChatContainerClass = (customClass?: string) => customClass ?? 'str-chat__container';

export const useChannelContainerClasses = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  customClasses,
}: Pick<ChatContextValue, 'customClasses'>) => {
  const windowsEmojiClass = useImageFlagEmojisOnWindowsClass<StreamChatGenerics>();
  return {
    channelClass: customClasses?.channel ?? 'str-chat__channel',
    chatClass: customClasses?.chat ?? 'str-chat',
    chatContainerClass: getChatContainerClass(customClasses?.chatContainer),
    windowsEmojiClass,
  };
};
