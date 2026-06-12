import React, { useMemo } from 'react';
import type { ChannelMemberResponse } from 'stream-chat';

import {
  useChatContext,
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../context';
import {
  SectionNavigatorHeader,
  type SectionNavigatorSectionContentProps,
} from '../../../../components/SectionNavigator';
import { ChannelAvatar as DefaultChannelAvatar } from '../../../../components/Avatar';
import { Prompt } from '../../../../components/Dialog';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import {
  type ChannelMemberActionItem,
  ChannelMemberActionProvider,
  defaultChannelMemberActionSet,
  useBaseChannelMemberActionSetFilter,
  useChannelMemberActionContext,
} from './ChannelMemberActions.defaults';
import { getMemberDisplayName } from '../ChannelMembersView/ChannelMembersView.utils';

export type ChannelMemberDetailProps = SectionNavigatorSectionContentProps & {
  channelMemberActionSet?: ChannelMemberActionItem[];
  member?: ChannelMemberResponse;
  onBack?: () => void;
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

export const ChannelMemberDetail = ({
  channelMemberActionSet = defaultChannelMemberActionSet,
  member,
  onBack,
}: ChannelMemberDetailProps) => {
  const { client } = useChatContext();
  const { channel } = useChannelDetailContext();
  const { close } = useModalContext();
  const { t } = useTranslationContext();

  const fallbackMember = useMemo(
    () =>
      Object.values(channel.state.members ?? {}).find(
        (stateMember) => stateMember.user?.id !== client.user?.id,
      ),
    [channel, client.user?.id],
  );
  const resolvedMember = member ?? fallbackMember;

  const memberDisplayName = resolvedMember ? getMemberDisplayName(resolvedMember) : '';
  const memberStatusText = getPresenceStatusText(resolvedMember?.user, t);

  const actionContextValue = useMemo(
    () =>
      resolvedMember
        ? {
            member: resolvedMember,
            memberDisplayName,
            targetUserId: resolvedMember.user?.id || resolvedMember.user_id,
          }
        : undefined,
    [memberDisplayName, resolvedMember],
  );

  if (!actionContextValue) {
    return (
      <div className='str-chat__channel-detail__channel-member-detail-view'>
        <SectionNavigatorHeader
          close={close}
          goBack={onBack}
          title={t('Member detail')}
        />
        <Prompt.Body className='str-chat__channel-detail__channel-member-detail-view__body'>
          <div className='str-chat__channel-detail__channel-member-detail-view__empty-state'>
            {t('Member not found')}
          </div>
        </Prompt.Body>
      </div>
    );
  }

  return (
    <ChannelMemberActionProvider value={actionContextValue}>
      <ChannelMemberDetailContent
        channelMemberActionSet={channelMemberActionSet}
        memberDisplayName={memberDisplayName}
        memberStatusText={memberStatusText}
        onBack={onBack}
      />
    </ChannelMemberActionProvider>
  );
};

type ChannelMemberDetailContentProps = {
  channelMemberActionSet: ChannelMemberActionItem[];
  memberDisplayName: string;
  memberStatusText: string;
  onBack?: () => void;
};

const ChannelMemberDetailContent = ({
  channelMemberActionSet,
  memberDisplayName,
  memberStatusText,
  onBack,
}: ChannelMemberDetailContentProps) => {
  const { close } = useModalContext();
  const { t } = useTranslationContext();
  const { Avatar = DefaultChannelAvatar } = useComponentContext();
  const { member } = useChannelMemberActionContext();

  const filteredActions = useBaseChannelMemberActionSetFilter(channelMemberActionSet);

  return (
    <div className='str-chat__channel-detail__channel-member-detail-view'>
      <SectionNavigatorHeader close={close} goBack={onBack} title={t('Member detail')} />
      <Prompt.Body className='str-chat__channel-detail__channel-member-detail-view__body'>
        <div className='str-chat__channel-detail__channel-member-detail-view__profile'>
          <Avatar
            imageUrl={member.user?.image}
            isOnline={member.user?.online}
            size='2xl'
            userName={memberDisplayName}
          />
          <div className='str-chat__channel-detail__channel-member-detail-view__profile__details'>
            <div className='str-chat__channel-detail__channel-member-detail-view__profile__details__title'>
              {memberDisplayName}
            </div>
            <div className='str-chat__channel-detail__channel-member-detail-view__profile__details__connection-status'>
              {memberStatusText}
            </div>
          </div>
        </div>

        <div className='str-chat__channel-detail__channel-member-detail-view__actions str-chat__form__switch-fieldset'>
          {filteredActions.map(({ Component, type }) => (
            <Component key={type} />
          ))}
        </div>
      </Prompt.Body>
    </div>
  );
};
