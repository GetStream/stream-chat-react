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
import { useChannelMemberCount } from './useChannelMemberCount';
import {
  SectionNavigatorHeader,
  type SectionNavigatorSectionContentProps,
} from '../../../../components/SectionNavigator';

export type ChannelMembersHeaderActionsProps = {
  modeController: ChannelMembersModeController;
  HeaderActionsMenuTrigger?: React.ComponentType<ChannelMembersHeaderActionsMenuTriggerProps>;
  headerActionSet: ChannelMembersHeaderActionItem[];
};

/**
 * Built-in modes are rendered by `ChannelMembersView` itself. Any other string
 * is treated as a custom mode and rendered from the injected `modeViews` registry.
 */
export type ChannelMembersViewMode = 'add' | 'browse' | 'memberDetail' | (string & {});

export type ChannelMembersModeController = {
  mode: ChannelMembersViewMode;
  setMode: (mode: ChannelMembersViewMode) => void;
};

export type ChannelMembersModeViewProps = {
  /**
   * Navigation surface for the mode. Call `modeController.setMode('browse')` to
   * return to the list, or any other mode key to transition between modes.
   */
  modeController: ChannelMembersModeController;
};

export type ChannelMembersViewModeDescriptor = {
  /** Body rendered below the section header for this mode. */
  Body: React.ComponentType<ChannelMembersModeViewProps>;
  /**
   * Header title for this mode. A component (rather than a string) so it can pull
   * whatever it needs from context/hooks — member count, translation, etc.
   */
  Title: React.ComponentType;
};

/** Registry of modes, keyed by the mode string passed to `setMode`. */
export type ChannelMembersViewModes = Record<string, ChannelMembersViewModeDescriptor>;

// `browse` (the default list) and `memberDetail` (selection-driven, renders its
// own header) are handled by ChannelMembersView directly; every other mode —
// built-in `add` or app-provided — is resolved from the mode-view registry.
const RESERVED_MODES: ChannelMembersViewMode[] = ['browse', 'memberDetail'];

const isReservedMode = (mode: ChannelMembersViewMode) => RESERVED_MODES.includes(mode);

const AddMembersModeTitle = () => {
  const { t } = useTranslationContext();
  return <>{t('Add members')}</>;
};

/** Built-in mode descriptors. Merged with (and overridable by) the `modeViews` prop. */
export const defaultChannelMembersModeViews: ChannelMembersViewModes = {
  add: {
    Body: ChannelMembersAddView,
    Title: AddMembersModeTitle,
  },
};

export type ChannelMembersViewProps = SectionNavigatorSectionContentProps & {
  HeaderActions?: React.ComponentType<ChannelMembersHeaderActionsProps>;
  HeaderActionsMenuTrigger?: React.ComponentType<ChannelMembersHeaderActionsMenuTriggerProps>;
  headerActionSet?: ChannelMembersHeaderActionItem[];
  /** App-provided modes (e.g. bulk removal) rendered alongside the built-in ones. */
  modeViews?: ChannelMembersViewModes;
};

export const ChannelMembersView = ({
  HeaderActions = DefaultHeaderActions,
  headerActionSet = defaultChannelMembersHeaderActionSet,
  HeaderActionsMenuTrigger,
  layout,
  modeViews: customModeViews,
}: ChannelMembersViewProps) => {
  const { t } = useTranslationContext();
  const { channel } = useChannelDetailContext();
  const { close } = useModalContext();
  const [mode, setMode] = useState<ChannelMembersViewMode>('browse');
  const [selectedMember, setSelectedMember] = useState<ChannelMemberResponse>();
  const memberCount = useChannelMemberCount(channel);

  const modeViews = useMemo(
    () => ({ ...defaultChannelMembersModeViews, ...customModeViews }),
    [customModeViews],
  );

  const activeModeDescriptor = isReservedMode(mode) ? undefined : modeViews[mode];
  const isViewingMemberDetail = mode === 'memberDetail';

  const setViewMode = useCallback((nextMode: ChannelMembersViewMode) => {
    setMode(nextMode);
    if (nextMode !== 'memberDetail') {
      setSelectedMember(undefined);
    }
  }, []);

  // Fall back to the browse list if an unknown mode becomes active (e.g. the app
  // stops providing the mode's descriptor while it is selected).
  useEffect(() => {
    if (!isReservedMode(mode) && !modeViews[mode]) {
      setViewMode('browse');
    }
  }, [mode, modeViews, setViewMode]);

  const goBack = useCallback(() => setViewMode('browse'), [setViewMode]);

  const modeController = useMemo<ChannelMembersModeController>(
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
            headerActionSet={headerActionSet}
            HeaderActionsMenuTrigger={HeaderActionsMenuTrigger}
            modeController={modeController}
          />
        );
      },
    [HeaderActions, HeaderActionsMenuTrigger, modeController, headerActionSet, mode],
  );

  if (isViewingMemberDetail && selectedMember) {
    return (
      <ChannelMemberDetail layout={layout} member={selectedMember} onBack={goBack} />
    );
  }

  const ActiveModeTitle = activeModeDescriptor?.Title;
  const ActiveModeBody = activeModeDescriptor?.Body;

  return (
    <div className='str-chat__channel-detail__channel-members-view'>
      <SectionNavigatorHeader
        close={close}
        description={activeModeDescriptor ? undefined : t('Browse channel members')}
        goBack={activeModeDescriptor ? goBack : undefined}
        title={
          ActiveModeTitle ? (
            <ActiveModeTitle />
          ) : (
            t('{{ count }} members', { count: memberCount })
          )
        }
        TrailingContent={HeaderTrailingActions}
      />
      {ActiveModeBody ? (
        <ActiveModeBody modeController={modeController} />
      ) : (
        <ChannelMembersBrowseView
          onMemberSelect={(member) => {
            setSelectedMember(member);
            setViewMode('memberDetail');
          }}
        />
      )}
    </div>
  );
};
