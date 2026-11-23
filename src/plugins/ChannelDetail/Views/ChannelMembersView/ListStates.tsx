import React from 'react';

import { useTranslationContext } from '../../../../context';
import { ChannelDetailEmptyList } from '../../ChannelDetailEmptyList';

// The empty states of the members and add-members views.

/** The members view's empty state, used while the app sets no `ListEmptyUI`. */
export const ChannelMembersEmpty = () => {
  const { t } = useTranslationContext();
  return (
    <ChannelDetailEmptyList>
      {t('channelDetail.channelMembersBrowse.noMemberFound.text', 'No member found')}
    </ChannelDetailEmptyList>
  );
};

/** The add-members view's empty state, used while the app sets no `ListEmptyUI`. */
export const ChannelMembersAddEmpty = () => {
  const { t } = useTranslationContext();
  return (
    <ChannelDetailEmptyList>
      {t('channelDetail.channelMembersAdd.noUserFound.text', 'No user found')}
    </ChannelDetailEmptyList>
  );
};
