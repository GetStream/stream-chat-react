import {
  asDynamicKey,
  type AttachmentSelectorAction,
  type AttachmentSelectorActionProps,
  ContextMenuButton,
  useContextMenuContext,
  useTranslationContext,
} from 'stream-chat-react';

import { IconCalendar } from '../icons';
import { EventInviteDialog } from './EventInviteDialog';

/**
 * The selector action's `type`. Not one of the SDK's built-in types, so the selector offers the
 * action without its availability rules.
 */
export const EVENT_INVITE_ACTION_TYPE = 'createEventInvite';

const EventInviteActionButton = ({
  openModalForAction,
}: AttachmentSelectorActionProps) => {
  const { t } = useTranslationContext();
  const { closeMenu } = useContextMenuContext();
  return (
    <ContextMenuButton
      className='str-chat__attachment-selector-actions-menu__button app__event-invite-action-button'
      Icon={IconCalendar}
      onClick={() => {
        openModalForAction(EVENT_INVITE_ACTION_TYPE);
        closeMenu();
      }}
    >
      {t(asDynamicKey('viteExample.eventInvite.action.text'), 'Event')}
    </ContextMenuButton>
  );
};

/** The attachment selector's Event action: its menu item opens `EventInviteDialog`. */
export const eventInviteAction: AttachmentSelectorAction = {
  ActionButton: EventInviteActionButton,
  ModalContent: EventInviteDialog,
  type: EVENT_INVITE_ACTION_TYPE,
};

/** Adds the Event action above Commands, or last when the set has no Commands action. */
export const withEventInviteAction = (actionSet: AttachmentSelectorAction[]) => {
  const commandsIndex = actionSet.findIndex(({ type }) => type === 'selectCommand');
  const insertAt = commandsIndex === -1 ? actionSet.length : commandsIndex;
  return [
    ...actionSet.slice(0, insertAt),
    eventInviteAction,
    ...actionSet.slice(insertAt),
  ];
};
