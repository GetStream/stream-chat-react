import React from 'react';
import { useTranslationContext } from '../../context';

export type ChannelListHeaderProps = {
  /** Rendered at the end of the header, after the title. No default. */
  EndContent?: React.ComponentType;
  /** Rendered at the start of the header, before the title. No default. */
  StartContent?: React.ComponentType;
};

/** Header of the channel list: the "Chats" title, with optional start and end content. */
export const ChannelListHeader = ({
  EndContent,
  StartContent,
}: ChannelListHeaderProps) => {
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__channel-list__header'>
      {StartContent && <StartContent />}
      <div className='str-chat__channel-list__header__title'>
        {t('channelList.header.chats.text', 'Chats')}
      </div>
      {EndContent && <EndContent />}
    </div>
  );
};
