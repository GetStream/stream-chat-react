import React, { useMemo } from 'react';
import type { ChannelMemberResponse } from 'stream-chat';

import {
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../context';
import {
  SectionNavigatorHeader,
  type SectionNavigatorSectionContentProps,
} from '../../SectionNavigator';
import { ChannelAvatar as DefaultChannelAvatar } from '../../../../components/Avatar';
import { Prompt } from '../../../../components/Dialog';
import {
  type ChannelMemberActionItem,
  ChannelMemberActionProvider,
  defaultChannelMemberActionSet,
  useBaseChannelMemberActionSetFilter,
  useChannelMemberActionContext,
} from './ChannelMemberActions.defaults';
import { getMemberDisplayName } from '../ChannelMembersView/ChannelMembersView.utils';

export type ChannelMemberDetailProps = SectionNavigatorSectionContentProps & {
  /** The member whose details are shown. Required — the view is always opened
   * for a specific, selected member. */
  member: ChannelMemberResponse;
  channelMemberActionSet?: ChannelMemberActionItem[];
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
  const { t } = useTranslationContext();

  const memberDisplayName = getMemberDisplayName(member);
  const memberStatusText = getPresenceStatusText(member.user, t);

  const actionContextValue = useMemo(
    () => ({
      member,
      memberDisplayName,
      targetUserId: member.user?.id || member.user_id,
    }),
    [member, memberDisplayName],
  );

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
