import { useChatContext } from '../../../context/ChatContext';
import type { ChatContextValue } from '../../../context/ChatContext';

export const useImageFlagEmojisOnWindowsClass = () => {
  const { useImageFlagEmojisOnWindows } = useChatContext('Channel');
  return useImageFlagEmojisOnWindows && navigator.userAgent.match(/Win/)
    ? 'str-chat--windows-flags'
    : '';
};

export const getChatContainerClass = (customClass?: string) =>
  customClass ?? 'str-chat__container';

export const useChannelContainerClasses = ({
  customClasses,
}: Pick<ChatContextValue, 'customClasses'>) => {
  const windowsEmojiClass = useImageFlagEmojisOnWindowsClass();
  return {
    channelClass: customClasses?.channel ?? 'str-chat__channel',
    chatClass: customClasses?.chat ?? 'str-chat',
    chatContainerClass: getChatContainerClass(customClasses?.chatContainer),
    windowsEmojiClass,
  };
};
