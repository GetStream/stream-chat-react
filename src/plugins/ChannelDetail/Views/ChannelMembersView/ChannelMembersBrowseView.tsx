import type { ChannelMemberResponse } from 'stream-chat';
import React, { useCallback, useMemo } from 'react';

import { useChatContext, useTranslationContext } from '../../../../context';
import { Avatar } from '../../../../components/Avatar';
import { IconMute } from '../../../../components/Icons';
import { ListItemLayout } from '../../../../components/ListItemLayout';
import { VirtualizedList } from '../../VirtualizedList';
import { Prompt } from '../../../../components/Dialog';
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

const ChannelMembersBrowseViewItem = ({
  isMuted,
  member,
  onMemberSelect,
}: {
  isMuted: boolean;
  member: ChannelMemberResponse;
  onMemberSelect?: (member: ChannelMemberResponse) => void;
}) => {
  const { t } = useTranslationContext();
  const user = member.user;
  const displayName = getMemberDisplayName(member);
  const roleTranslation = getMemberRoleTranslation(member, t);

  const LeadingSlot = useMemo(
    () =>
      function MemberAvatar() {
        return (
          <Avatar
            imageUrl={user?.image}
            isOnline={user?.online}
            size='md'
            userName={getUserDisplayName(user)}
          />
        );
      },
    [user],
  );

  const TrailingSlot = useMemo(
    () =>
      function MemberTrailingSlot() {
        return (
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
        );
      },
    [isMuted, roleTranslation],
  );

  const rootProps = useMemo(
    () => ({
      'aria-label': t('View member details for {{ member }}', {
        member: displayName,
      }),
      className: 'str-chat__channel-detail__channel-members-view__list-item',
      onClick: () => onMemberSelect?.(member),
    }),
    [displayName, member, onMemberSelect, t],
  );

  return (
    <ListItemLayout
      LeadingSlot={LeadingSlot}
      RootElement='button'
      rootProps={rootProps}
      subtitle={getPresenceStatusText(user, t)}
      title={displayName}
      TrailingSlot={TrailingSlot}
    />
  );
};

const computeMemberItemKey = (_: number, member: ChannelMemberResponse) =>
  getMemberUserId(member) as string;

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
    () => new Set(mutes.map((mute) => mute.target?.id)),
    [mutes],
  );

  // Only members with a resolvable user id are rendered; pre-filtering keeps the
  // virtualized item renderer total in sync with what it can actually display.
  const renderableMembers = useMemo(
    () => displayedMembers.filter((member) => getMemberUserId(member)),
    [displayedMembers],
  );

  const renderItem = useCallback(
    (_: number, member: ChannelMemberResponse) => (
      <ChannelMembersBrowseViewItem
        isMuted={mutedUserIdSet.has(getMemberUserId(member) as string)}
        member={member}
        onMemberSelect={onMemberSelect}
      />
    ),
    [mutedUserIdSet, onMemberSelect],
  );

  const EmptyPlaceholder = useMemo(
    () =>
      function ChannelMembersEmptyPlaceholder() {
        return <ChannelDetailEmptyList>{t('No member found')}</ChannelDetailEmptyList>;
      },
    [t],
  );

  const Footer = useMemo(
    () =>
      function ChannelMembersListFooter() {
        return <ChannelDetailListLoadingIndicator searchSource={membersSearchSource} />;
      },
    [membersSearchSource],
  );

  return (
    <Prompt.Body className='str-chat__channel-members-view__body'>
      {hasMembers && (
        <ChannelDetailSearchInput
          onSearchChange={handleSearchChange}
          resetKey={searchInputResetKey}
        />
      )}
      <VirtualizedList
        className='str-chat__channel-detail__channel-members-view__list'
        computeItemKey={computeMemberItemKey}
        data={renderableMembers}
        EmptyPlaceholder={EmptyPlaceholder}
        Footer={Footer}
        itemContent={renderItem}
        loadNext={hasMembers ? membersSearchSource.search : undefined}
      />
    </Prompt.Body>
  );
};
