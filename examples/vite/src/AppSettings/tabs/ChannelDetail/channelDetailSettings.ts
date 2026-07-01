import {
  type ChannelMembersHeaderActionItem,
  DefaultChannelMembersHeaderActions,
} from 'stream-chat-react/channel-detail';

import type {
  ChannelDetailSettingsState,
  ChannelMembersHeaderActionId,
} from '../../state';
import {
  RemoveMembersHeaderAction,
  RemoveMembersMenuAction,
} from './removeMembersHeaderActions';

export const channelMembersHeaderActionLabels: Record<
  ChannelMembersHeaderActionId,
  string
> = {
  addMembers: 'Add members',
  removeMembers: 'Remove members',
};

// Bulk removal is an app-defined action, so the app owns its permission check.
// (The SDK gates its own `addMembers` action internally.)
const canRemoveMembers: ChannelMembersHeaderActionItem['filter'] = ({ channel }) =>
  channel.data?.own_capabilities?.includes('update-channel-members') ?? false;

export const getChannelMembersHeaderActionSet = (
  channelDetail: ChannelDetailSettingsState,
): ChannelMembersHeaderActionItem[] => {
  const { headerActions } = channelDetail.modal.channelMembersView;
  const actionSet: ChannelMembersHeaderActionItem[] = [];

  (Object.keys(headerActions) as ChannelMembersHeaderActionId[]).forEach((type) => {
    const action = headerActions[type];

    if (!action.enabled) return;

    switch (type) {
      case 'addMembers':
        actionSet.push({
          component:
            action.form === 'quick'
              ? DefaultChannelMembersHeaderActions.AddMembers
              : DefaultChannelMembersHeaderActions.AddMembersMenu,
          placement: action.form,
          type,
        });
        break;
      case 'removeMembers':
        actionSet.push({
          component:
            action.form === 'quick' ? RemoveMembersHeaderAction : RemoveMembersMenuAction,
          filter: canRemoveMembers,
          placement: action.form,
          type,
        });
        break;
      default:
        break;
    }
  });

  return actionSet;
};
