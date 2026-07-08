import React from 'react';
import { useComponentContext, useTranslationContext } from '../../context';
import { useSlotChannels } from '../ChatView';

export const ChannelListHeader = () => {
  const { t } = useTranslationContext();
  const { HeaderEndContent } = useComponentContext();
  // A channel is "active" when one is bound in a channel slot (mirrors ThreadListHeader).
  const hasActiveChannel = useSlotChannels().length > 0;
  return (
    <div className='str-chat__channel-list__header'>
      <div className='str-chat__channel-list__header__title'>{t('Chats')}</div>
      {hasActiveChannel && HeaderEndContent && <HeaderEndContent />}
    </div>
  );
};
