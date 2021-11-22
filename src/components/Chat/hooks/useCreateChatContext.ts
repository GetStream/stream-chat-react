import { useMemo } from 'react';

import type { ChatContextValue } from '../../../context/ChatContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const useCreateChatContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  value: ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    channel,
    client,
    closeMobileNav,
    customClasses,
    getAppSettings,
    mutes,
    navOpen,
    openMobileNav,
    setActiveChannel,
    theme,
    useImageFlagEmojisOnWindows,
  } = value;

  const channelCid = channel?.cid;
  const clientValues = `${client.clientID}${Object.keys(client.activeChannels).length}${
    Object.keys(client.listeners).length
  }${client.mutedChannels.length}
  ${client.user?.id}`;
  const mutedUsersLength = mutes.length;

  const chatContext: ChatContextValue<At, Ch, Co, Ev, Me, Re, Us> = useMemo(
    () => ({
      channel,
      client,
      closeMobileNav,
      customClasses,
      getAppSettings,
      mutes,
      navOpen,
      openMobileNav,
      setActiveChannel,
      theme,
      useImageFlagEmojisOnWindows,
    }),
    [channelCid, clientValues, getAppSettings, mutedUsersLength, navOpen],
  );

  return chatContext;
};
