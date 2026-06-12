import {
  type ChannelMembersHeaderActionItem,
  DefaultChannelMembersHeaderActions,
} from 'stream-chat-react/channel-detail';

import type {
  ChannelDetailSettingsState,
  ChannelMembersHeaderActionId,
} from '../../state';

export const channelMembersHeaderActionLabels: Record<
  ChannelMembersHeaderActionId,
  string
> = {
  addMembers: 'Add members',
  removeMembers: 'Remove members',
};

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
        actionSet.push(
          action.form === 'quick'
            ? {
                quick: DefaultChannelMembersHeaderActions.AddMembers,
                type,
              }
            : {
                menu: DefaultChannelMembersHeaderActions.AddMembersMenu,
                type,
              },
        );
        break;
      case 'removeMembers':
        actionSet.push(
          action.form === 'quick'
            ? {
                quick: DefaultChannelMembersHeaderActions.RemoveMembers,
                type,
              }
            : {
                menu: DefaultChannelMembersHeaderActions.RemoveMembersMenu,
                type,
              },
        );
        break;
      default:
        break;
    }
  });

  return actionSet;
};
