import type { ChannelMemberResponse, UserResponse } from 'stream-chat';
import { useMemo, useState } from 'react';
import {
  Avatar,
  Checkbox,
  InfiniteScrollPaginator,
  ListItemLayout,
  Prompt,
  useNotificationApi,
  useTranslationContext,
} from 'stream-chat-react';
import {
  ChannelDetailEmptyList,
  ChannelDetailListLoadingIndicator,
  ChannelDetailSearchInput,
  type ChannelMembersModeViewProps,
  useChannelDetailContext,
  useChannelMembersSearch,
} from 'stream-chat-react/channel-detail';

// Bulk member removal is demonstrated as application code: the SDK no longer
// ships a bulk-remove view, matching the other-language Stream SDKs. It is
// wired into `ChannelMembersView` through the injectable `modeViews` registry.

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error('An unknown error occurred');

const getUserDisplayName = (user?: UserResponse) =>
  user?.name || user?.username || user?.id || '';

const getMemberDisplayName = (member: ChannelMemberResponse) =>
  getUserDisplayName(member.user) || member.user_id || '';

const getMemberUserId = (member: ChannelMemberResponse) =>
  member.user?.id || member.user_id;

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

export const ChannelMembersRemoveView = ({
  modeController,
}: ChannelMembersModeViewProps) => {
  const { t } = useTranslationContext();
  const { channel } = useChannelDetailContext();
  const { addNotification } = useNotificationApi();
  const {
    displayedMembers,
    handleSearchChange,
    membersSearchSource,
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
      addNotification({
        context: { channel },
        emitter: 'ChannelMembersRemoveView',
        message: t('Removed {{ count }} members', { count: memberCount }),
        severity: 'success',
        type: 'api:channel:remove-members:success',
      });
      // Return to the browse list; its header member count updates reactively
      // from real channel state — no manual count bookkeeping needed here.
      modeController.setMode('browse');
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelMembersRemoveView',
        error: toError(error),
        message: t('Error removing members'),
        severity: 'error',
        type: 'api:channel:remove-members:failed',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <Prompt.Body className='str-chat__channel-members-view__body'>
        <ChannelDetailSearchInput
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
            <ChannelDetailEmptyList>{t('No member found')}</ChannelDetailEmptyList>
          )}
          <ChannelDetailListLoadingIndicator searchSource={membersSearchSource} />
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
