import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { useAttachmentManagerState, useMessageComposer } from '../hooks';
import { CHANNEL_CONTAINER_ID } from '../../Channel/constants';
import {
  ContextMenu,
  ContextMenuButton,
  DialogAnchor,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from '../../Dialog';
import { Modal as DefaultModal } from '../../Modal';
import { ShareLocationDialog as DefaultLocationDialog } from '../../Location';
import { PollCreationDialog as DefaultPollCreationDialog } from '../../Poll';
import { Portal } from '../../Portal/Portal';
import { UploadFileInput } from '../../ReactFileUtilities';
import {
  useChannelStateContext,
  useComponentContext,
  useTranslationContext,
} from '../../../context';
import {
  AttachmentSelectorContextProvider,
  useAttachmentSelectorContext,
} from '../../../context/AttachmentSelectorContext';
import { useStableId } from '../../UtilityComponents/useStableId';
import clsx from 'clsx';
import { Button, type ButtonProps } from '../../Button';
import { IconCommand, IconFile, IconLocationPin, IconPlus, IconPoll } from '../../Icons';
import { useIsCooldownActive } from '../hooks/useIsCooldownActive';

const AttachmentSelectorMenuInitButtonIcon = () => {
  const { AttachmentSelectorInitiationButtonContents } = useComponentContext();

  if (AttachmentSelectorInitiationButtonContents) {
    return <AttachmentSelectorInitiationButtonContents />;
  }

  return <IconPlus className='str-chat__attachment-selector__menu-button__icon' />;
};

export const AttachmentSelectorButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function AttachmentSelectorButton({ className, ...props }, ref) {
    return (
      <Button
        className={clsx(
          'str-chat__attachment-selector__menu-button',
          'str-chat__button--outline',
          'str-chat__button--secondary',
          'str-chat__button--size-lg',
          'str-chat__button--circular',
          className,
        )}
        data-testid='invoke-attachment-selector-button'
        {...props}
        ref={ref}
      >
        <AttachmentSelectorMenuInitButtonIcon />
      </Button>
    );
  },
);

export const SimpleAttachmentSelector = () => {
  const { channelCapabilities } = useChannelStateContext();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null);
  const id = useStableId();
  const isCooldownActive = useIsCooldownActive();

  useEffect(() => {
    if (!buttonElement) return;
    const handleKeyUp = (event: KeyboardEvent) => {
      if (![' ', 'Enter'].includes(event.key) || !inputRef.current) return;
      event.preventDefault();
      inputRef.current.click();
    };
    buttonElement.addEventListener('keyup', handleKeyUp);
    return () => {
      buttonElement.removeEventListener('keyup', handleKeyUp);
    };
  }, [buttonElement]);

  if (!channelCapabilities['upload-file']) return null;

  return (
    <div className='str-chat__attachment-selector'>
      <AttachmentSelectorButton
        disabled={isCooldownActive}
        onClick={() => inputRef.current?.click()}
        ref={setButtonElement}
      />
      <UploadFileInput id={id} ref={inputRef} />
    </div>
  );
};

export type AttachmentSelectorModalContentProps = {
  close: () => void;
};

export type AttachmentSelectorActionProps = {
  closeMenu: () => void;
  openModalForAction: (actionType: AttachmentSelectorAction['type']) => void;
};

export type AttachmentSelectorAction = {
  ActionButton: React.ComponentType<AttachmentSelectorActionProps>;
  type: 'uploadFile' | 'createPoll' | 'addLocation' | 'selectCommand' | (string & {});
  ModalContent?: React.ComponentType<AttachmentSelectorModalContentProps>;
};

export const DefaultAttachmentSelectorComponents = {
  // todo: we do not know how the submenu should look like
  Command() {
    const { t } = useTranslationContext();
    return (
      <ContextMenuButton
        className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__create-poll-button'
        Icon={IconCommand}
        Submenu={() => null}
      >
        {t('Commands')}
      </ContextMenuButton>
    );
  },
  File({ closeMenu }: AttachmentSelectorActionProps) {
    const { t } = useTranslationContext();
    const { fileInput } = useAttachmentSelectorContext();
    const { isUploadEnabled } = useAttachmentManagerState();

    return (
      <ContextMenuButton
        className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__upload-file-button'
        disabled={!isUploadEnabled} // todo: add styles for disabled state
        Icon={IconFile}
        onClick={() => {
          if (fileInput) fileInput.click();
          closeMenu();
        }}
      >
        {t('File')}
      </ContextMenuButton>
    );
  },
  Location({ closeMenu, openModalForAction }: AttachmentSelectorActionProps) {
    const { t } = useTranslationContext();
    return (
      <ContextMenuButton
        className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__add-location-button'
        Icon={IconLocationPin}
        onClick={() => {
          openModalForAction('addLocation');
          closeMenu();
        }}
      >
        {t('Location')}
      </ContextMenuButton>
    );
  },
  Poll({ closeMenu, openModalForAction }: AttachmentSelectorActionProps) {
    const { t } = useTranslationContext();
    return (
      <ContextMenuButton
        className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__create-poll-button'
        Icon={IconPoll}
        onClick={() => {
          openModalForAction('createPoll');
          closeMenu();
        }}
      >
        {t('Poll')}
      </ContextMenuButton>
    );
  },
};

/**
 * Order of AttachmentSelectorAction objects defines the order in the context menu width index 0 being at the top.
 */
export const defaultAttachmentSelectorActionSet: AttachmentSelectorAction[] = [
  { ActionButton: DefaultAttachmentSelectorComponents.File, type: 'uploadFile' },
  {
    ActionButton: DefaultAttachmentSelectorComponents.Poll,
    type: 'createPoll',
  },
  {
    ActionButton: DefaultAttachmentSelectorComponents.Location,
    type: 'addLocation',
  },
  { ActionButton: DefaultAttachmentSelectorComponents.Command, type: 'selectCommand' },
];

export type AttachmentSelectorProps = {
  attachmentSelectorActionSet?: AttachmentSelectorAction[];
  getModalPortalDestination?: () => HTMLElement | null;
};

const useAttachmentSelectorActionsFiltered = (original: AttachmentSelectorAction[]) => {
  const {
    PollCreationDialog = DefaultPollCreationDialog,
    ShareLocationDialog = DefaultLocationDialog,
  } = useComponentContext();
  const { channelCapabilities } = useChannelStateContext();
  const messageComposer = useMessageComposer();
  const channelConfig = messageComposer.channel.getConfig();

  return original
    .filter((action) => {
      if (action.type === 'uploadFile')
        return channelCapabilities['upload-file'] && channelConfig?.uploads;

      if (action.type === 'createPoll')
        return (
          channelCapabilities['send-poll'] &&
          !messageComposer.threadId &&
          channelConfig?.polls
        );

      if (action.type === 'addLocation') {
        return channelConfig?.shared_locations && !messageComposer.threadId;
      }
      return true;
    })
    .map((action) => {
      if (action.type === 'createPoll' && !action.ModalContent) {
        return { ...action, ModalContent: PollCreationDialog };
      }
      if (action.type === 'addLocation' && !action.ModalContent) {
        return { ...action, ModalContent: ShareLocationDialog };
      }
      return action;
    });
};

export const AttachmentSelector = ({
  attachmentSelectorActionSet = defaultAttachmentSelectorActionSet,
  getModalPortalDestination,
}: AttachmentSelectorProps) => {
  const { t } = useTranslationContext();
  const { Modal = DefaultModal } = useComponentContext();
  const { channelCapabilities } = useChannelStateContext();
  const messageComposer = useMessageComposer();
  const isCooldownActive = useIsCooldownActive();
  const actions = useAttachmentSelectorActionsFiltered(attachmentSelectorActionSet);

  const menuDialogId = `attachment-actions-menu${messageComposer.threadId ? '-thread' : ''}`;
  const { dialog: menuDialog, dialogManager } = useDialogOnNearestManager({
    id: menuDialogId,
  });
  const menuDialogIsOpen = useDialogIsOpen(menuDialogId, dialogManager?.id);

  const [modalContentAction, setModalContentActionAction] =
    useState<AttachmentSelectorAction>();
  const openModal = useCallback(
    (actionType: AttachmentSelectorAction['type']) => {
      const action = actions.find((a) => a.type === actionType);
      if (!action?.ModalContent) return;
      setModalContentActionAction(action);
    },
    [actions],
  );

  const closeModal = useCallback(() => setModalContentActionAction(undefined), []);

  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const getDefaultPortalDestination = useCallback(
    () => document.getElementById(CHANNEL_CONTAINER_ID),
    [],
  );

  if (actions.length === 0) return null;

  if (actions.length === 1 && actions[0].type === 'uploadFile')
    return <SimpleAttachmentSelector />;

  const ModalContent = modalContentAction?.ModalContent;
  const modalIsOpen = !!ModalContent;
  return (
    <AttachmentSelectorContextProvider value={{ fileInput }}>
      <div className='str-chat__attachment-selector'>
        {channelCapabilities['upload-file'] && <UploadFileInput ref={setFileInput} />}
        <AttachmentSelectorButton
          aria-expanded={menuDialogIsOpen}
          aria-haspopup='true'
          aria-label={t('aria/Open Attachment Selector')}
          className={clsx('str-chat__prepare-rotate45', {
            'str-chat__rotate45': menuDialogIsOpen,
          })}
          disabled={isCooldownActive}
          onClick={() => menuDialog?.toggle()}
          ref={menuButtonRef}
        />
        <DialogAnchor
          dialogManagerId={dialogManager?.id}
          id={menuDialogId}
          placement='top-start'
          referenceElement={menuButtonRef.current}
          tabIndex={-1}
          trapFocus
        >
          <ContextMenu
            className='str-chat__attachment-selector-actions-menu str-chat__dialog-menu'
            data-testid='attachment-selector-actions-menu'
          >
            {actions.map(({ ActionButton, type }) => (
              <ActionButton
                closeMenu={menuDialog.close}
                key={`attachment-selector-item-${type}`}
                openModalForAction={openModal}
              />
            ))}
          </ContextMenu>
        </DialogAnchor>
        <Portal
          getPortalDestination={getModalPortalDestination ?? getDefaultPortalDestination}
          isOpen={modalIsOpen}
        >
          <Modal
            className={clsx({
              'str-chat__create-poll-modal': modalContentAction?.type === 'createPoll',
              'str-chat__share-location-modal':
                modalContentAction?.type === 'addLocation',
            })}
            onClose={closeModal}
            open={modalIsOpen}
          >
            {ModalContent && <ModalContent close={closeModal} />}
          </Modal>
        </Portal>
      </div>
    </AttachmentSelectorContextProvider>
  );
};
