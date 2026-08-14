import type { ComponentProps } from 'react';
import { useState } from 'react';
import {
  Button,
  ContextMenu,
  ContextMenuButton,
  IconBolt,
  Tooltip,
  useContextMenuContext,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from 'stream-chat-react';
import {
  NotificationPromptDialog,
  notificationPromptDialogId,
} from './NotificationPromptDialog';
import {
  AttachmentPromptDialog,
  attachmentPromptDialogId,
} from './AttachmentPromptDialog';
import {
  WebSocketEventPromptDialog,
  webSocketEventPromptDialogId,
} from './WebSocketEventPromptDialog';

import {
  isServerSideClientEnabled,
  ServerSideClientPromptDialog,
  serverSideClientPromptDialogId,
} from './ServerSideClientPromptDialog';

const actionsMenuDialogId = 'app-actions-menu';

// Read once at module scope — the flag comes from the URL and does not change within a session.
const serverSideClientEnabled = isServerSideClientEnabled();

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
      <Tooltip
        aria-hidden='true'
        className='str-chat__chat-view__selector-button-tooltip'
      >
        Actions
      </Tooltip>
    )}
  </div>
);

export const ActionsMenu = ({ iconOnly = true }: { iconOnly?: boolean }) => {
  const [menuButtonElement, setMenuButtonElement] = useState<HTMLButtonElement | null>(
    null,
  );
  const { dialog: actionsMenuDialog, dialogManager } = useDialogOnNearestManager({
    id: actionsMenuDialogId,
  });
  const { dialog: notificationDialog } = useDialogOnNearestManager({
    id: notificationPromptDialogId,
  });
  const { dialog: attachmentDialog } = useDialogOnNearestManager({
    id: attachmentPromptDialogId,
  });
  const { dialog: webSocketEventDialog } = useDialogOnNearestManager({
    id: webSocketEventPromptDialogId,
  });
  const { dialog: serverSideClientDialog } = useDialogOnNearestManager({
    id: serverSideClientPromptDialogId,
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
        <TriggerNotificationAction onTrigger={notificationDialog.open} />
        <TriggerAttachmentAction onTrigger={attachmentDialog.open} />
        <TriggerWebSocketEventAction onTrigger={webSocketEventDialog.open} />
        {serverSideClientEnabled && (
          <TriggerServerSideClientAction onTrigger={serverSideClientDialog.open} />
        )}
      </ContextMenu>
      <NotificationPromptDialog referenceElement={menuButtonElement} />
      <AttachmentPromptDialog referenceElement={menuButtonElement} />
      <WebSocketEventPromptDialog referenceElement={menuButtonElement} />
      {serverSideClientEnabled && (
        <ServerSideClientPromptDialog referenceElement={menuButtonElement} />
      )}
    </div>
  );
};

function TriggerNotificationAction({ onTrigger }: { onTrigger: () => void }) {
  const { closeMenu } = useContextMenuContext();

  return (
    <ContextMenuButton
      label='Trigger Notification'
      onClick={() => {
        closeMenu();
        onTrigger();
      }}
    />
  );
}

function TriggerAttachmentAction({ onTrigger }: { onTrigger: () => void }) {
  const { closeMenu } = useContextMenuContext();

  return (
    <ContextMenuButton
      label='Message Composer'
      onClick={() => {
        closeMenu();
        onTrigger();
      }}
    />
  );
}

function TriggerWebSocketEventAction({ onTrigger }: { onTrigger: () => void }) {
  const { closeMenu } = useContextMenuContext();

  return (
    <ContextMenuButton
      label='Trigger WS Event'
      onClick={() => {
        closeMenu();
        onTrigger();
      }}
    />
  );
}

function TriggerServerSideClientAction({ onTrigger }: { onTrigger: () => void }) {
  const { closeMenu } = useContextMenuContext();

  return (
    <ContextMenuButton
      label='Server-side Client'
      onClick={() => {
        closeMenu();
        onTrigger();
      }}
    />
  );
}
