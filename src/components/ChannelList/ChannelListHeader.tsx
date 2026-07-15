import React from 'react';
import {
  useComponentContext,
  useTranslationContext,
  useWorkspaceNavigation,
} from '../../context';

export const ChannelListHeader = () => {
  const { t } = useTranslationContext();
  const { HeaderEndContent } = useComponentContext();
  // A channel is "active" when one is open in the workspace (mirrors ThreadListHeader).
  const hasActiveChannel = useWorkspaceNavigation().openChannels.length > 0;
  return (
    <div className='str-chat__channel-list__header'>
      <div className='str-chat__channel-list__header__title'>{t('Chats')}</div>
      {hasActiveChannel && HeaderEndContent && <HeaderEndContent />}
    </div>
  );
};
