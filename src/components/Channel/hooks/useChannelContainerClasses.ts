import { useChatContext } from '../../../context/ChatContext';
import type { ChatContextValue } from '../../../context/ChatContext';

export const useImageFlagEmojisOnWindowsClass = () => {
  const { useImageFlagEmojisOnWindows } = useChatContext();
  return useImageFlagEmojisOnWindows && navigator.userAgent.match(/Win/)
    ? 'str-chat--windows-flags'
    : '';
};

export const useChannelContainerClasses = ({
  customClasses,
}: Pick<ChatContextValue, 'customClasses'>) => {
  const windowsEmojiClass = useImageFlagEmojisOnWindowsClass();
  return {
    channelClass: customClasses?.channel ?? 'str-chat__channel',
    chatClass: customClasses?.chat ?? 'str-chat',
    windowsEmojiClass,
  };
};
