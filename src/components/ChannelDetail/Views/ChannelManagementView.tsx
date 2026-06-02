import {
  useChannelStateContext,
  useChatContext,
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../context';
import { isDmChannel } from '../../../utils';
import type { SectionNavigatorSectionContentProps } from '../../SectionNavigator';
import { ChannelAvatar as DefaultChannelAvatar } from '../../Avatar';
import { useChannelPreviewInfo } from '../../ChannelListItem';
import { IconMute, IconPin } from '../../Icons';
import React from 'react';
import { useChannelMembershipState } from '../../ChannelList';
import { useIsChannelMuted } from '../../ChannelListItem/hooks/useIsChannelMuted';
import { useChannelHasMembersOnline } from '../../ChannelHeader/hooks/useChannelHasMembersOnline';
import { Prompt } from '../../Dialog';
import {
  type ChannelInfoActionItem,
  defaultChannelInfoActionSet,
  useBaseChannelInfoActionSetFilter,
} from './ChannelInfoActions.defaults';
import { useChannelHeaderOnlineStatus } from '../../ChannelHeader/hooks/useChannelHeaderOnlineStatus';

export type ChannelManagementViewProps = SectionNavigatorSectionContentProps & {
  channelInfoActionSet?: ChannelInfoActionItem[];
};

export const ChannelManagementView = ({
  channelInfoActionSet = defaultChannelInfoActionSet,
}: ChannelManagementViewProps) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const { close } = useModalContext();
  const { Avatar = DefaultChannelAvatar } = useComponentContext();
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
  });
  const isOnline = useChannelHasMembersOnline();
  const { muted: channelMuted } = useIsChannelMuted(channel);
  const userMuted = false;
  const membership = useChannelMembershipState(channel);
  const actions = useBaseChannelInfoActionSetFilter(channelInfoActionSet);
  const onlineStatusText = useChannelHeaderOnlineStatus();

  const pinned = !!membership.pinned_at;
  const resolvedIsDmChannel = isDmChannel({
    channel,
    ownUserId: client.user?.id,
  });

  return (
    <div className='str-chat__channel-detail__channel-management-view'>
      <Prompt.Header
        close={close}
        description={t('Manage channel')}
        title={resolvedIsDmChannel ? t('Contact info') : t('Group info')}
      />
      <Prompt.Body className='str-chat__channel-detail__channel-management-view__body'>
        <div className='str-chat__channel-detail__channel-management-view__profile'>
          <Avatar
            displayMembers={groupChannelDisplayInfo.members}
            imageUrl={displayImage}
            isOnline={resolvedIsDmChannel ? isOnline : undefined}
            size='2xl'
            userName={displayTitle}
          />
          <div className='str-chat__channel-detail__channel-management-view__profile__details'>
            <div className='str-chat__channel-detail__channel-management-view__profile__details__title'>
              {displayTitle && <span>{displayTitle}</span>}
              {pinned && <IconPin />}
              {(resolvedIsDmChannel && userMuted) ||
              (!resolvedIsDmChannel && channelMuted) ? (
                <IconMute />
              ) : null}
            </div>
            {onlineStatusText && (
              <div className='str-chat__channel-detail__channel-management-view__profile__details__connection-status'>
                {onlineStatusText}
              </div>
            )}
          </div>
        </div>

        <div className='str-chat__channel-detail__channel-management-view__actions str-chat__form__switch-fieldset'>
          {actions.map(({ Component, type }) => (
            <Component key={type} />
          ))}
        </div>
      </Prompt.Body>
    </div>
  );
};
