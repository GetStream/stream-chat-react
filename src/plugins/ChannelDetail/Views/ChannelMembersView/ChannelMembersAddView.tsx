import { type SearchSourceState, type UserResponse, UserSearchSource } from 'stream-chat';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useChatContext, useTranslationContext } from '../../../../context';
import { useStateStore } from '../../../../store';
import { Avatar } from '../../../../components/Avatar';
import { Checkbox } from '../../../../components/Form';
import { IconMute } from '../../../../components/Icons';
import { ListItemLayout } from '../../../../components/ListItemLayout';
import { VirtualizedList } from '../../VirtualizedList';
import { Prompt } from '../../../../components/Dialog';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { canUpdateChannelMembers, getUserDisplayName } from './ChannelMembersView.utils';
import { useChannelMemberIds } from './useChannelMemberIds';
import type { ChannelMembersModeViewProps } from './ChannelMembersView';
import { useNotificationApi } from '../../../../components/Notifications';
import { ChannelDetailSearchInput } from '../../ChannelDetailSearchInput';
import { ChannelDetailEmptyList } from '../../ChannelDetailEmptyList';
import { ChannelDetailListLoadingIndicator } from '../../ChannelDetailListLoadingIndicator';

export type ChannelMembersAddViewProps = ChannelMembersModeViewProps & {
  searchSource?: UserSearchSource;
};

const USER_SEARCH_PAGE_SIZE = 30;

const searchSourceItemsStateSelector = (state: SearchSourceState<UserResponse>) => ({
  isLoading: state.isLoading,
  users: state.items,
});

const EMPTY_USERS: UserResponse[] = [];

const computeUserItemKey = (_: number, user: UserResponse) => user.id;

const MuteIndicator = () => (
  <IconMute className='str-chat__channel-detail__action-icon str-chat__channel-detail__action-icon--mute' />
);

const readOnlyRootProps = {
  className: 'str-chat__channel-detail__channel-members-view__list-item',
};

const ChannelMembersAddViewItem = ({
  canManageChannelMembers,
  isMember,
  isMuted,
  isSelected,
  toggleSelectedUser,
  user,
}: {
  canManageChannelMembers: boolean;
  isMember: boolean;
  isMuted: boolean;
  isSelected: boolean;
  toggleSelectedUser: (userId: string) => void;
  user: UserResponse;
}) => {
  const { t } = useTranslationContext();
  const displayName = getUserDisplayName(user);

  const LeadingSlot = useMemo(
    () =>
      function MemberAvatar() {
        return (
          <Avatar
            imageUrl={user.image}
            isOnline={user.online}
            size='md'
            userName={displayName}
          />
        );
      },
    [displayName, user.image, user.online],
  );

  const SelectableTrailingSlot = useMemo(
    () =>
      function SelectCheckbox() {
        return <Checkbox aria-hidden checked={isSelected} />;
      },
    [isSelected],
  );

  const selectableRootProps = useMemo(
    () => ({
      'aria-pressed': isSelected,
      className: 'str-chat__channel-detail__channel-members-view__list-item',
      onClick: () => toggleSelectedUser(user.id),
    }),
    [isSelected, toggleSelectedUser, user.id],
  );

  // Only non-members can be selected for adding. Existing members are
  // listed (and flagged below) but render as a non-actionable row, like
  // the read-only no-permission case.
  if (canManageChannelMembers && !isMember) {
    return (
      <ListItemLayout
        LeadingSlot={LeadingSlot}
        RootElement='button'
        rootProps={selectableRootProps}
        title={displayName}
        TrailingSlot={SelectableTrailingSlot}
      />
    );
  }

  return (
    <ListItemLayout
      LeadingSlot={LeadingSlot}
      rootProps={readOnlyRootProps}
      subtitle={isMember ? t('Already a member') : undefined}
      title={displayName}
      TrailingSlot={isMuted ? MuteIndicator : undefined}
    />
  );
};

export const ChannelMembersAddView = ({
  modeController,
  searchSource,
}: ChannelMembersAddViewProps) => {
  const { client, mutes } = useChatContext();
  const { t } = useTranslationContext();
  const { channel } = useChannelDetailContext();
  const canManageChannelMembers = canUpdateChannelMembers(channel);
  const { addNotification } = useNotificationApi();

  const memberUserIds = useChannelMemberIds(channel);
  const memberIdSet = useMemo(() => new Set(memberUserIds), [memberUserIds]);

  const userSearchSource = useMemo(
    () =>
      searchSource ??
      new UserSearchSource(client, {
        allowEmptySearchString: true,
        pageSize: USER_SEARCH_PAGE_SIZE,
        resetOnNewSearchQuery: false,
      }),
    [client, searchSource],
  );

  const { isLoading, users } = useStateStore(
    userSearchSource.state,
    searchSourceItemsStateSelector,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    userSearchSource.activate();
    userSearchSource.search('');

    return () => userSearchSource.cancelScheduledQuery();
  }, [userSearchSource]);

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

  const renderItem = useCallback(
    (_: number, user: UserResponse) => (
      <ChannelMembersAddViewItem
        canManageChannelMembers={canManageChannelMembers}
        isMember={memberIdSet.has(user.id)}
        isMuted={mutedUserIdSet.has(user.id)}
        isSelected={selectedUserIdSet.has(user.id)}
        toggleSelectedUser={toggleSelectedUser}
        user={user}
      />
    ),
    [
      canManageChannelMembers,
      memberIdSet,
      mutedUserIdSet,
      selectedUserIdSet,
      toggleSelectedUser,
    ],
  );

  // Only show the "no results" copy once a query has resolved (`users` is an
  // array); while the first page loads `users` is undefined and nothing shows.
  const EmptyPlaceholder = useMemo(
    () =>
      function ChannelMembersAddEmptyPlaceholder() {
        if (isLoading || !users) return null;
        return <ChannelDetailEmptyList>{t('No user found')}</ChannelDetailEmptyList>;
      },
    [isLoading, t, users],
  );

  const Footer = useMemo(
    () =>
      function ChannelMembersAddListFooter() {
        return <ChannelDetailListLoadingIndicator searchSource={userSearchSource} />;
      },
    [userSearchSource],
  );

  const handleSave = async () => {
    if (!canManageChannelMembers || !selectedUserIds.length || isSaving) return;

    setIsSaving(true);
    try {
      await channel.addMembers(selectedUserIds);
      addNotification({
        context: { channel },
        emitter: 'ChannelMembersView',
        message: t('{{ count }} members added', { count: selectedUserIds.length }),
        severity: 'success',
        type: 'api:channel:addMembers:success',
      });
      setSelectedUserIds([]);
      setIsSaving(false);
      modeController.setMode('browse');
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
        <VirtualizedList
          className='str-chat__channel-detail__channel-members-view__list'
          computeItemKey={computeUserItemKey}
          data={users ?? EMPTY_USERS}
          EmptyPlaceholder={EmptyPlaceholder}
          Footer={Footer}
          itemContent={renderItem}
          loadNext={userSearchSource.search}
        />
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
