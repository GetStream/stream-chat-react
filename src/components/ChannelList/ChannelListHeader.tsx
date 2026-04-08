import React from 'react';
import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';

export const ChannelListHeader = () => {
  const { t } = useTranslationContext();
  const { channel } = useChatContext();
  const { HeaderEndContent } = useComponentContext();
  return (
    <div className='str-chat__channel-list__header'>
      <div className='str-chat__channel-list__header__title'>{t('Chats')}</div>
      {channel && HeaderEndContent && <HeaderEndContent />}
    </div>
  );
};
