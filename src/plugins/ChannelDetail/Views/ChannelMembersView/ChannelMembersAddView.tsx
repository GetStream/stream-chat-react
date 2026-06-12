import { type SearchSourceState, type UserResponse, UserSearchSource } from 'stream-chat';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useChatContext, useTranslationContext } from '../../../../context';
import { useStateStore } from '../../../../store';
import { Avatar } from '../../../../components/Avatar';
import { Checkbox } from '../../../../components/Form';
import { IconMute } from '../../../../components/Icons';
import { InfiniteScrollPaginator } from '../../../../components/InfiniteScrollPaginator/InfiniteScrollPaginator';
import { ListItemLayout } from '../../../../components/ListItemLayout';
import { Prompt } from '../../../../components/Dialog';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import {
  canUpdateChannelMembers,
  getChannelMemberUserIds,
  getUserDisplayName,
} from './ChannelMembersView.utils';
import { useNotificationApi } from '../../../../components/Notifications';
import { ChannelDetailSearchInput } from '../../ChannelDetailSearchInput';
import { ChannelDetailEmptyList } from '../../ChannelDetailEmptyList';
import { ChannelDetailListLoadingIndicator } from '../../ChannelDetailListLoadingIndicator';

export type ChannelMembersAddViewProps = {
  onMembersAdded: (memberCount: number) => void;
  searchSource?: UserSearchSource;
};

const USER_SEARCH_PAGE_SIZE = 30;

const searchSourceItemsStateSelector = (state: SearchSourceState<UserResponse>) => ({
  isLoading: state.isLoading,
  users: state.items,
});

export const ChannelMembersAddView = ({
  onMembersAdded,
  searchSource,
}: ChannelMembersAddViewProps) => {
  const { client, mutes } = useChatContext();
  const { t } = useTranslationContext();
  const { channel } = useChannelDetailContext();
  const canManageChannelMembers = canUpdateChannelMembers(channel);
  const { addNotification } = useNotificationApi();

  const memberUserIds = useMemo(() => getChannelMemberUserIds(channel), [channel]);
  const excludedMemberIds = useMemo(() => new Set(memberUserIds), [memberUserIds]);

  const userSearchSource = useMemo(() => {
    const source =
      searchSource ??
      new UserSearchSource(client, {
        allowEmptySearchString: true,
        pageSize: USER_SEARCH_PAGE_SIZE,
        resetOnNewSearchQuery: false,
      });

    source.activate();
    return source;
  }, [client, searchSource]);

  const { isLoading, users: searchUsers } = useStateStore(
    userSearchSource.state,
    searchSourceItemsStateSelector,
  );

  const users = useMemo(
    () => searchUsers?.filter((user) => !excludedMemberIds.has(user.id)),
    [excludedMemberIds, searchUsers],
  );

  const [isSaving, setIsSaving] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => () => userSearchSource.cancelScheduledQuery(), [userSearchSource]);

  useEffect(() => {
    userSearchSource.search('');
  }, [userSearchSource]);

  const loadNextPageOnScroll = useCallback(
    (distanceFromBottom: number, distanceFromTop: number, threshold: number) => {
      if (distanceFromTop > 0 && distanceFromBottom < threshold) {
        userSearchSource.search();
      }
    },
    [userSearchSource],
  );

  const selectedUserIdSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);
  const mutedUserIdSet = useMemo(
    () => new Set(mutes.map((mute) => mute.target.id)),
    [mutes],
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      userSearchSource.search(query);
    },
    [userSearchSource],
  );

  const toggleSelectedUser = useCallback(
    (userId: string) =>
      setSelectedUserIds((currentSelectedUserIds) =>
        currentSelectedUserIds.includes(userId)
          ? currentSelectedUserIds.filter((id) => id !== userId)
          : [...currentSelectedUserIds, userId],
      ),
    [],
  );

  const handleSave = async () => {
    if (!canManageChannelMembers || !selectedUserIds.length || isSaving) return;

    setIsSaving(true);
    try {
      await channel.addMembers(selectedUserIds);
      onMembersAdded(selectedUserIds.length);
      addNotification({
        context: { channel },
        emitter: 'ChannelMembersView',
        message: t('{{ count }} members added', { count: selectedUserIds.length }),
        severity: 'success',
        type: 'api:channel:addMembers:success',
      });
    } catch (error) {
      setIsSaving(false);
      addNotification({
        context: { channel },
        emitter: 'ChannelMembersView',
        error: error as Error,
        message: t('Error adding members'),
        severity: 'error',
        type: 'api:channel:addMembers:failed',
      });
    }
  };

  return (
    <>
      <Prompt.Body className='str-chat__channel-members-view__body'>
        <ChannelDetailSearchInput autoFocus onSearchChange={handleSearchChange} />
        <InfiniteScrollPaginator
          className='str-chat__channel-detail__channel-members-view__list'
          listenToScroll={loadNextPageOnScroll}
          threshold={40}
        >
          {users && users.length > 0 ? (
            users.map((user) => {
              const displayName = getUserDisplayName(user);
              const isMuted = mutedUserIdSet.has(user.id);
              const avatar = (
                <Avatar
                  imageUrl={user.image}
                  isOnline={user.online}
                  size='md'
                  userName={displayName}
                />
              );

              if (canManageChannelMembers) {
                const selected = selectedUserIdSet.has(user.id);

                return (
                  <ListItemLayout
                    key={user.id}
                    LeadingSlot={() => avatar}
                    RootElement='button'
                    rootProps={{
                      'aria-pressed': selected,
                      className:
                        'str-chat__channel-detail__channel-members-view__list-item',
                      onClick: () => toggleSelectedUser(user.id),
                    }}
                    title={displayName}
                    TrailingSlot={() => <Checkbox aria-hidden checked={selected} />}
                  />
                );
              }

              return (
                <ListItemLayout
                  key={user.id}
                  LeadingSlot={() => avatar}
                  rootProps={{
                    className:
                      'str-chat__channel-detail__channel-members-view__list-item',
                  }}
                  title={displayName}
                  TrailingSlot={
                    isMuted
                      ? () => (
                          <IconMute className='str-chat__channel-detail__action-icon str-chat__channel-detail__action-icon--mute' />
                        )
                      : undefined
                  }
                />
              );
            })
          ) : !isLoading && users ? (
            <ChannelDetailEmptyList>{t('No user found')}</ChannelDetailEmptyList>
          ) : null}
          {isLoading && (
            <ChannelDetailListLoadingIndicator searchSource={userSearchSource} />
          )}
        </InfiniteScrollPaginator>
      </Prompt.Body>
      {canManageChannelMembers && selectedUserIds.length > 0 && (
        <Prompt.Footer>
          <Prompt.FooterControls>
            <Prompt.FooterControlsButtonPrimary disabled={isSaving} onClick={handleSave}>
              {t('Add {{ count }} members', { count: selectedUserIds.length })}
            </Prompt.FooterControlsButtonPrimary>
          </Prompt.FooterControls>
        </Prompt.Footer>
      )}
    </>
  );
};
