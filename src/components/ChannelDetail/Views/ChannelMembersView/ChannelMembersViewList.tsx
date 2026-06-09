import {
  type ChannelMemberResponse,
  ChannelMembersPaginator,
  type PaginatorState,
} from 'stream-chat';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useChatContext, useTranslationContext } from '../../../../context';
import { useStateStore } from '../../../../store';
import { Avatar } from '../../../Avatar';
import { Checkbox, TextInput } from '../../../Form';
import { IconMute, IconSearch } from '../../../Icons';
import { InfiniteScrollPaginator } from '../../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { ListItemLayout } from '../../../ListItemLayout';
import { Prompt } from '../../../Dialog';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import {
  canUpdateChannelMembers,
  CHANNEL_MEMBERS_QUERY_LIMIT,
  getMemberDisplayName,
  getUserDisplayName,
} from './ChannelMembersView.utils';

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

const membersPaginatorStateSelector = (state: PaginatorState<ChannelMemberResponse>) => ({
  isLoading: state.isLoading,
  members: state.items,
});

const MEMBERS_SEARCH_DEBOUNCE_MS = 300;

export type ChannelMembersViewListProps = {
  onMemberSelect?: (member: ChannelMemberResponse) => void;
  onMembersRemoved?: (memberCount: number) => void;
  removeMembers?: boolean;
};

const getMemberUserId = (member: ChannelMemberResponse) =>
  member.user?.id || member.user_id;

export const ChannelMembersViewList = ({
  onMemberSelect,
  onMembersRemoved,
  removeMembers = false,
}: ChannelMembersViewListProps) => {
  const { mutes } = useChatContext();
  const { t } = useTranslationContext();
  const { channel } = useChannelDetailContext();
  const canManageChannelMembers = canUpdateChannelMembers(channel);
  const isRemoveMode = removeMembers && canManageChannelMembers;
  const fallbackMembers = useMemo(
    () => Object.values(channel.state?.members ?? {}),
    [channel],
  );
  const membersPaginator = useMemo(
    () =>
      new ChannelMembersPaginator(channel, {
        pageSize: CHANNEL_MEMBERS_QUERY_LIMIT,
      }),
    [channel],
  );
  const searchMembers = useMemo(
    () =>
      debounce((query: string) => {
        const trimmedQuery = query.trim();
        membersPaginator.filters = trimmedQuery
          ? { name: { $autocomplete: trimmedQuery } }
          : undefined;
        membersPaginator.next();
      }, MEMBERS_SEARCH_DEBOUNCE_MS),
    [membersPaginator],
  );
  const { isLoading, members } = useStateStore(
    membersPaginator.state,
    membersPaginatorStateSelector,
  );
  const [searchInput, setSearchInput] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedMemberUserIds, setSelectedMemberUserIds] = useState<string[]>([]);
  const wasManagingMembersRef = useRef(removeMembers);

  const resetMembersSearch = useCallback(() => {
    searchMembers.cancel();
    membersPaginator.cancelScheduledQuery();
    setSearchInput('');
    membersPaginator.filters = undefined;
    void membersPaginator.next();
  }, [membersPaginator, searchMembers]);

  const displayedMembers = members ?? fallbackMembers;
  const selectedMemberUserIdSet = useMemo(
    () => new Set(selectedMemberUserIds),
    [selectedMemberUserIds],
  );
  const mutedUserIdSet = useMemo(
    () => new Set(mutes.map((mute) => mute.target.id)),
    [mutes],
  );

  useEffect(() => {
    if (!isRemoveMode) {
      setSelectedMemberUserIds([]);
      setIsRemoving(false);
    }
  }, [isRemoveMode]);

  useEffect(() => {
    if (wasManagingMembersRef.current && !removeMembers) {
      resetMembersSearch();
      setSelectedMemberUserIds([]);
      setIsRemoving(false);
    }

    wasManagingMembersRef.current = removeMembers;
  }, [removeMembers, resetMembersSearch]);

  useEffect(() => {
    membersPaginator.next();
  }, [membersPaginator]);

  useEffect(
    () => () => {
      searchMembers.cancel();
      membersPaginator.cancelScheduledQuery();
    },
    [membersPaginator, searchMembers],
  );

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setSearchInput(value);
      searchMembers(value);
    },
    [searchMembers],
  );

  const toggleSelectedMember = useCallback((memberUserId: string) => {
    setSelectedMemberUserIds((currentSelectedMemberUserIds) =>
      currentSelectedMemberUserIds.includes(memberUserId)
        ? currentSelectedMemberUserIds.filter((id) => id !== memberUserId)
        : [...currentSelectedMemberUserIds, memberUserId],
    );
  }, []);

  const handleRemove = async () => {
    if (!isRemoveMode || !selectedMemberUserIds.length || isRemoving) return;

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

  const emptyStateText = isLoading ? t('Searching...') : t('No user found');

  return (
    <>
      <Prompt.Body className='str-chat__channel-members-view__body'>
        <TextInput
          aria-label={t('Search')}
          className='str-chat__channel-detail__channel-members-view__search-input'
          leading={<IconSearch />}
          onChange={handleSearchChange}
          placeholder={t('Search')}
          type='search'
          value={searchInput}
        />
        <InfiniteScrollPaginator
          className='str-chat__channel-detail__channel-members-view__list'
          loadNextOnScrollToBottom={membersPaginator.next}
        >
          {displayedMembers.length > 0 ? (
            displayedMembers.map((member) => {
              const memberUserId = getMemberUserId(member);
              if (!memberUserId) return null;

              const user = member.user;
              const displayName = getMemberDisplayName(member);
              const roleTranslation = getMemberRoleTranslation(member, t);
              const isMuted = mutedUserIdSet.has(memberUserId);
              const avatar = (
                <Avatar
                  imageUrl={user?.image}
                  isOnline={user?.online}
                  size='md'
                  userName={getUserDisplayName(user)}
                />
              );

              if (isRemoveMode) {
                const selected = selectedMemberUserIdSet.has(memberUserId);

                return (
                  <ListItemLayout
                    key={memberUserId}
                    LeadingSlot={() => avatar}
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
              }

              return (
                <ListItemLayout
                  key={memberUserId}
                  LeadingSlot={() => avatar}
                  RootElement='button'
                  rootProps={{
                    'aria-label': t('View member details for {{ member }}', {
                      member: displayName,
                    }),
                    className:
                      'str-chat__channel-detail__channel-members-view__list-item',
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
            <div className='str-chat__channel-detail__channel-members-view__empty-state'>
              <IconSearch />
              <span>{emptyStateText}</span>
            </div>
          )}
        </InfiniteScrollPaginator>
      </Prompt.Body>
      {isRemoveMode && selectedMemberUserIds.length > 0 && (
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
