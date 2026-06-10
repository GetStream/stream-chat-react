import type { ChannelMemberResponse } from 'stream-chat';
import React, { useMemo, useState } from 'react';

import { useTranslationContext } from '../../../../context';
import { Avatar } from '../../../Avatar';
import { Checkbox } from '../../../Form';
import { InfiniteScrollPaginator } from '../../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { ListItemLayout } from '../../../ListItemLayout';
import { Prompt } from '../../../Dialog';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import {
  canUpdateChannelMembers,
  getMemberDisplayName,
  getMemberUserId,
  getUserDisplayName,
} from './ChannelMembersView.utils';
import { ChannelMembersBrowseView } from './ChannelMembersBrowseView';
import { ChannelMembersViewEmptyList } from './ChannelMembersViewEmptyList';
import { ChannelMembersViewListFooter } from './ChannelMembersViewListFooter';
import { ChannelMembersViewSearchInput } from './ChannelMembersViewSearchInput';
import { useChannelMembersSearch } from './useChannelMembersSearch';

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

export type ChannelMembersRemoveViewProps = {
  onMembersRemoved?: (memberCount: number) => void;
};

const ChannelMembersRemoveList = ({
  onMembersRemoved,
}: ChannelMembersRemoveViewProps) => {
  const { t } = useTranslationContext();
  const { channel } = useChannelDetailContext();
  const {
    displayedMembers,
    handleSearchChange,
    membersSearchSource,
    resetMembersSearch,
    searchInputResetKey,
  } = useChannelMembersSearch();
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedMemberUserIds, setSelectedMemberUserIds] = useState<string[]>([]);
  const selectedMemberUserIdSet = useMemo(
    () => new Set(selectedMemberUserIds),
    [selectedMemberUserIds],
  );

  const toggleSelectedMember = (memberUserId: string) => {
    setSelectedMemberUserIds((currentSelectedMemberUserIds) =>
      currentSelectedMemberUserIds.includes(memberUserId)
        ? currentSelectedMemberUserIds.filter((id) => id !== memberUserId)
        : [...currentSelectedMemberUserIds, memberUserId],
    );
  };

  const handleRemove = async () => {
    if (!selectedMemberUserIds.length || isRemoving) return;

    setIsRemoving(true);
    const memberCount = selectedMemberUserIds.length;

    try {
      await channel.removeMembers(selectedMemberUserIds);
      setSelectedMemberUserIds([]);
      resetMembersSearch();
      onMembersRemoved?.(memberCount);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <Prompt.Body className='str-chat__channel-members-view__body'>
        <ChannelMembersViewSearchInput
          onSearchChange={handleSearchChange}
          resetKey={searchInputResetKey}
        />
        <InfiniteScrollPaginator
          className='str-chat__channel-detail__channel-members-view__list'
          loadNextOnScrollToBottom={membersSearchSource.search}
        >
          {displayedMembers.length > 0 ? (
            displayedMembers.map((member) => {
              const memberUserId = getMemberUserId(member);
              if (!memberUserId) return null;

              const user = member.user;
              const displayName = getMemberDisplayName(member);
              const selected = selectedMemberUserIdSet.has(memberUserId);

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
                    'aria-pressed': selected,
                    className:
                      'str-chat__channel-detail__channel-members-view__list-item',
                    onClick: () => toggleSelectedMember(memberUserId),
                  }}
                  subtitle={getPresenceStatusText(user, t)}
                  title={displayName}
                  TrailingSlot={() => <Checkbox aria-hidden checked={selected} />}
                />
              );
            })
          ) : (
            <ChannelMembersViewEmptyList />
          )}
          <ChannelMembersViewListFooter searchSource={membersSearchSource} />
        </InfiniteScrollPaginator>
      </Prompt.Body>
      {selectedMemberUserIds.length > 0 && (
        <Prompt.Footer>
          <Prompt.FooterControls>
            <Prompt.FooterControlsButtonPrimary
              disabled={isRemoving}
              onClick={handleRemove}
            >
              {t('Remove {{ count }} members', { count: selectedMemberUserIds.length })}
            </Prompt.FooterControlsButtonPrimary>
          </Prompt.FooterControls>
        </Prompt.Footer>
      )}
    </>
  );
};

export const ChannelMembersRemoveView = (props: ChannelMembersRemoveViewProps) => {
  const { channel } = useChannelDetailContext();
  const canManageChannelMembers = canUpdateChannelMembers(channel);

  if (!canManageChannelMembers) return <ChannelMembersBrowseView />;

  return <ChannelMembersRemoveList {...props} />;
};
