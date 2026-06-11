import type { ChannelMemberResponse } from 'stream-chat';
import React, { useMemo } from 'react';

import { useChatContext, useTranslationContext } from '../../../../context';
import { Avatar } from '../../../Avatar';
import { IconMute } from '../../../Icons';
import { InfiniteScrollPaginator } from '../../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { ListItemLayout } from '../../../ListItemLayout';
import { Prompt } from '../../../Dialog';
import {
  getMemberDisplayName,
  getMemberUserId,
  getUserDisplayName,
} from './ChannelMembersView.utils';
import { ChannelDetailEmptyList } from '../../ChannelDetailEmptyList';
import { ChannelDetailListLoadingIndicator } from '../../ChannelDetailListLoadingIndicator';
import { ChannelDetailSearchInput } from '../../ChannelDetailSearchInput';
import { useChannelMembersSearch } from './useChannelMembersSearch';

const getMemberRoleTranslation = (
  member: ChannelMemberResponse,
  t: ReturnType<typeof useTranslationContext>['t'],
) => {
  if ([member.user?.role, member.channel_role].includes('admin')) return t('Admin');
  if (member.channel_role === 'channel_moderator' || member.channel_role === 'moderator')
    return t('Moderator');
  if (member.role === 'owner') return t('Owner');

  return undefined;
};

const getPresenceStatusText = (
  user: ChannelMemberResponse['user'],
  t: ReturnType<typeof useTranslationContext>['t'],
) => {
  if (user?.online) return t('Online');

  if (user?.last_active) {
    return t('Last seen {{ timestamp }}', {
      timestamp: t('timestamp/ChannelMembersLastActive', {
        timestamp: user.last_active,
      }),
    });
  }

  return t('Offline');
};

export type ChannelMembersBrowseViewProps = {
  onMemberSelect?: (member: ChannelMemberResponse) => void;
};

export const ChannelMembersBrowseView = ({
  onMemberSelect,
}: ChannelMembersBrowseViewProps) => {
  const { mutes } = useChatContext();
  const { t } = useTranslationContext();
  const {
    displayedMembers,
    handleSearchChange,
    hasMembers,
    membersSearchSource,
    searchInputResetKey,
  } = useChannelMembersSearch();
  const mutedUserIdSet = useMemo(
    () => new Set(mutes.map((mute) => mute.target.id)),
    [mutes],
  );

  return (
    <Prompt.Body className='str-chat__channel-members-view__body'>
      {hasMembers && (
        <ChannelDetailSearchInput
          onSearchChange={handleSearchChange}
          resetKey={searchInputResetKey}
        />
      )}
      <InfiniteScrollPaginator
        className='str-chat__channel-detail__channel-members-view__list'
        loadNextOnScrollToBottom={hasMembers ? membersSearchSource.search : undefined}
      >
        {displayedMembers.length > 0 ? (
          displayedMembers.map((member) => {
            const memberUserId = getMemberUserId(member);
            if (!memberUserId) return null;

            const user = member.user;
            const displayName = getMemberDisplayName(member);
            const roleTranslation = getMemberRoleTranslation(member, t);
            const isMuted = mutedUserIdSet.has(memberUserId);

            return (
              <ListItemLayout
                key={memberUserId}
                LeadingSlot={() => (
                  <Avatar
                    imageUrl={user?.image}
                    isOnline={user?.online}
                    size='md'
                    userName={getUserDisplayName(user)}
                  />
                )}
                RootElement='button'
                rootProps={{
                  'aria-label': t('View member details for {{ member }}', {
                    member: displayName,
                  }),
                  className: 'str-chat__channel-detail__channel-members-view__list-item',
                  onClick: () => onMemberSelect?.(member),
                }}
                subtitle={getPresenceStatusText(user, t)}
                title={displayName}
                TrailingSlot={() => (
                  <div className='str-chat__channel-detail__channel-members-view__list-item__trailing-slot'>
                    {roleTranslation ? (
                      <span className='str-chat__channel-detail__channel-members-view__role-label'>
                        {roleTranslation}
                      </span>
                    ) : null}
                    {isMuted ? (
                      <IconMute className='str-chat__channel-detail__channel-members-view__list-item__indicator-icon str-chat__channel-detail__channel-members-view__list-item__indicator-icon--mute' />
                    ) : null}
                  </div>
                )}
              />
            );
          })
        ) : (
          <ChannelDetailEmptyList>{t('No member found')}</ChannelDetailEmptyList>
        )}
        <ChannelDetailListLoadingIndicator searchSource={membersSearchSource} />
      </InfiniteScrollPaginator>
    </Prompt.Body>
  );
};
