import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChannelMemberResponse } from 'stream-chat';

import { useModalContext, useTranslationContext } from '../../../../context';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { ChannelMemberDetail } from '../ChannelMemberDetailView';
import {
  type ChannelMembersHeaderActionItem,
  type ChannelMembersHeaderActionsMenuTriggerProps,
  defaultChannelMembersHeaderActionSet,
  DefaultHeaderActions,
} from './ChannelMembersHeaderActions.defaults';
import { ChannelMembersAddView } from './ChannelMembersAddView';
import { ChannelMembersBrowseView } from './ChannelMembersBrowseView';
import { ChannelMembersRemoveView } from './ChannelMembersRemoveView';
import {
  SectionNavigatorHeader,
  type SectionNavigatorSectionContentProps,
} from '../../../../components/SectionNavigator';

export type ChannelMembersHeaderActionsProps = {
  controller: ChannelMembersViewController;
  HeaderActionsMenuTrigger?: React.ComponentType<ChannelMembersHeaderActionsMenuTriggerProps>;
  headerActionSet: ChannelMembersHeaderActionItem[];
};

export type ChannelMembersViewMode = 'add' | 'browse' | 'remove' | 'memberDetail';

export type ChannelMembersViewController = {
  mode: ChannelMembersViewMode;
  setMode: (mode: ChannelMembersViewMode) => void;
};

export type ChannelMembersViewProps = SectionNavigatorSectionContentProps & {
  HeaderActions?: React.ComponentType<ChannelMembersHeaderActionsProps>;
  HeaderActionsMenuTrigger?: React.ComponentType<ChannelMembersHeaderActionsMenuTriggerProps>;
  headerActionSet?: ChannelMembersHeaderActionItem[];
};

export const ChannelMembersView = ({
  HeaderActions = DefaultHeaderActions,
  headerActionSet = defaultChannelMembersHeaderActionSet,
  HeaderActionsMenuTrigger,
  layout,
}: ChannelMembersViewProps) => {
  const { t } = useTranslationContext();
  const { channel } = useChannelDetailContext();
  const { close } = useModalContext();
  const [mode, setMode] = useState<ChannelMembersViewMode>('browse');
  const [selectedMember, setSelectedMember] = useState<ChannelMemberResponse>();
  const [memberCount, setMemberCount] = useState(channel.data?.member_count ?? 0);
  const [membersRefreshKey, setMembersRefreshKey] = useState(0);
  const [membersAddedCount, setMembersAddedCount] = useState(0);

  const isAddingMember = mode === 'add';
  const isManagingMembers = mode === 'remove';
  const isViewingMemberDetail = mode === 'memberDetail';
  const isAlternateMode = isAddingMember || isManagingMembers || isViewingMemberDetail;

  useEffect(() => {
    setMemberCount(channel.data?.member_count ?? 0);
  }, [channel.data?.member_count]);

  useEffect(() => {
    if (!membersAddedCount) return;

    const timeout = setTimeout(() => setMembersAddedCount(0), 3000);

    return () => clearTimeout(timeout);
  }, [membersAddedCount]);

  const setViewMode = useCallback((nextMode: ChannelMembersViewMode) => {
    setMode(nextMode);
    if (nextMode !== 'memberDetail') {
      setSelectedMember(undefined);
    }
  }, []);

  const goBack = useCallback(() => setViewMode('browse'), [setViewMode]);

  const controller = useMemo<ChannelMembersViewController>(
    () => ({
      mode,
      setMode: setViewMode,
    }),
    [mode, setViewMode],
  );

  const HeaderTrailingActions = useMemo(
    () =>
      function HeaderTrailingActions() {
        if (mode !== 'browse') return null;
        return (
          <HeaderActions
            controller={controller}
            headerActionSet={headerActionSet}
            HeaderActionsMenuTrigger={HeaderActionsMenuTrigger}
          />
        );
      },
    [HeaderActions, HeaderActionsMenuTrigger, controller, headerActionSet, mode],
  );

  const headerTitle = isAddingMember
    ? t('Add members')
    : isManagingMembers
      ? t('Manage members')
      : t('{{ count }} members', { count: memberCount });

  if (isViewingMemberDetail && selectedMember) {
    return (
      <ChannelMemberDetail layout={layout} member={selectedMember} onBack={goBack} />
    );
  }

  return (
    <div className='str-chat__channel-detail__channel-members-view'>
      <SectionNavigatorHeader
        close={close}
        description={isAlternateMode ? undefined : t('Browse channel members')}
        goBack={
          isAddingMember || isViewingMemberDetail || isManagingMembers
            ? goBack
            : undefined
        }
        title={headerTitle}
        TrailingContent={HeaderTrailingActions}
      />
      {isAddingMember ? (
        <ChannelMembersAddView
          onMembersAdded={(count) => {
            setMemberCount((currentCount) => currentCount + count);
            setMembersAddedCount(count);
            setMembersRefreshKey((currentKey) => currentKey + 1);
            goBack();
          }}
        />
      ) : isManagingMembers ? (
        <ChannelMembersRemoveView
          onMembersRemoved={(count) => {
            setMemberCount((currentCount) => currentCount - count);
          }}
        />
      ) : (
        <ChannelMembersBrowseView
          key={membersRefreshKey}
          onMemberSelect={(member) => {
            setSelectedMember(member);
            setViewMode('memberDetail');
          }}
        />
      )}
    </div>
  );
};
