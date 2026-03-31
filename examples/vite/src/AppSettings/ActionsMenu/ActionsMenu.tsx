import { useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import {
  Button,
  ContextMenu,
  ContextMenuButton,
  DialogManagerProvider,
  IconBolt,
  useContextMenuContext,
  useDialogIsOpen,
  useDialogOnNearestManager,
  type ContextMenuItemComponent,
} from 'stream-chat-react';
import {
  NotificationPromptDialog,
  notificationPromptDialogId,
} from './NotificationPromptDialog';

const actionsMenuDialogId = 'app-actions-menu';

const ActionsMenuButton = ({
  iconOnly,
  isOpen,
  onClick,
  refCallback,
}: {
  iconOnly: boolean;
  isOpen: boolean;
  onClick: ComponentProps<'button'>['onClick'];
  refCallback: (element: HTMLButtonElement | null) => void;
}) => (
  <div className='str-chat__chat-view__selector-button-container'>
    <Button
      appearance='ghost'
      aria-expanded={isOpen}
      aria-haspopup='true'
      aria-label='Open actions'
      className='str-chat__chat-view__selector-button app__settings-group_button'
      onClick={onClick}
      ref={refCallback}
      variant='secondary'
    >
      <IconBolt />
      {!iconOnly && (
        <div className='str-chat__chat-view__selector-button-text'>Actions</div>
      )}
    </Button>
    {iconOnly && (
      <div
        aria-hidden='true'
        className='str-chat__chat-view__selector-button-tooltip str-chat__tooltip'
      >
        Actions
      </div>
    )}
  </div>
);

export const ActionsMenu = ({ iconOnly = true }: { iconOnly?: boolean }) => (
  <DialogManagerProvider id='app-actions-menu-dialog-manager'>
    <ActionsMenuInner iconOnly={iconOnly} />
  </DialogManagerProvider>
);

function TriggerNotification() {
  const { closeMenu } = useContextMenuContext();
  const { dialog: notificationDialog } = useDialogOnNearestManager({
    id: notificationPromptDialogId,
  });

  return (
    <ContextMenuButton
      label='Trigger Notification'
      onClick={() => {
        closeMenu();
        notificationDialog.open();
      }}
    />
  );
}

const ActionsMenuInner = ({ iconOnly }: { iconOnly: boolean }) => {
  const [menuButtonElement, setMenuButtonElement] = useState<HTMLButtonElement | null>(
    null,
  );
  const { dialog: actionsMenuDialog, dialogManager } = useDialogOnNearestManager({
    id: actionsMenuDialogId,
  });

  const menuIsOpen = useDialogIsOpen(actionsMenuDialogId, dialogManager?.id);

  return (
    <div className='app__actions-menu-anchor'>
      <ActionsMenuButton
        iconOnly={iconOnly}
        isOpen={menuIsOpen}
        onClick={() => actionsMenuDialog.toggle()}
        refCallback={setMenuButtonElement}
      />
      <ContextMenu
        backLabel='Back'
        className='app__actions-menu'
        dialogManagerId={dialogManager?.id}
        id={actionsMenuDialogId}
        onClose={actionsMenuDialog.close}
        placement='right-start'
        referenceElement={menuButtonElement}
        tabIndex={-1}
        trapFocus
      >
        <TriggerNotification />
      </ContextMenu>
      <NotificationPromptDialog referenceElement={menuButtonElement} />
    </div>
  );
};
