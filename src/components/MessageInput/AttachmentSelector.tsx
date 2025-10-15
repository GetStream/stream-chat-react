import React, { useCallback, useEffect, useRef, useState } from 'react';
import { UploadIcon as DefaultUploadIcon } from './icons';
import { useAttachmentManagerState } from './hooks/useAttachmentManagerState';
import { CHANNEL_CONTAINER_ID } from '../Channel/constants';
import { DialogAnchor, useDialogIsOpen, useDialogOnNearestManager } from '../Dialog';
import { DialogMenuButton } from '../Dialog/DialogMenu';
import { Modal as DefaultModal } from '../Modal';
import { ShareLocationDialog as DefaultLocationDialog } from '../Location';
import { PollCreationDialog as DefaultPollCreationDialog } from '../Poll';
import { Portal } from '../Portal/Portal';
import { UploadFileInput } from '../ReactFileUtilities';
import {
  useChannelStateContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';
import {
  AttachmentSelectorContextProvider,
  useAttachmentSelectorContext,
} from '../../context/AttachmentSelectorContext';
import { useStableId } from '../UtilityComponents/useStableId';
import clsx from 'clsx';
import { useMessageComposer } from './hooks';

export const SimpleAttachmentSelector = () => {
  const {
    AttachmentSelectorInitiationButtonContents,
    FileUploadIcon = DefaultUploadIcon,
  } = useComponentContext();
  const { channelCapabilities } = useChannelStateContext();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [labelElement, setLabelElement] = useState<HTMLLabelElement | null>(null);
  const id = useStableId();

  useEffect(() => {
    if (!labelElement) return;
    const handleKeyUp = (event: KeyboardEvent) => {
      if (![' ', 'Enter'].includes(event.key) || !inputRef.current) return;
      event.preventDefault();
      inputRef.current.click();
    };
    labelElement.addEventListener('keyup', handleKeyUp);
    return () => {
      labelElement.removeEventListener('keyup', handleKeyUp);
    };
  }, [labelElement]);

  if (!channelCapabilities['upload-file']) return null;

  return (
    <div className='str-chat__file-input-container' data-testid='file-upload-button'>
      <UploadFileInput id={id} ref={inputRef} />
      <label
        className='str-chat__file-input-label'
        htmlFor={id}
        ref={setLabelElement}
        tabIndex={0}
      >
        {AttachmentSelectorInitiationButtonContents ? (
          <AttachmentSelectorInitiationButtonContents />
        ) : (
          <FileUploadIcon />
        )}
      </label>
    </div>
  );
};

const AttachmentSelectorMenuInitButtonIcon = () => {
  const { AttachmentSelectorInitiationButtonContents, FileUploadIcon } =
    useComponentContext('SimpleAttachmentSelector');
  if (AttachmentSelectorInitiationButtonContents) {
    return <AttachmentSelectorInitiationButtonContents />;
  }
  if (FileUploadIcon) {
    return <FileUploadIcon />;
  }
  return <div className='str-chat__attachment-selector__menu-button__icon' />;
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
  type: 'uploadFile' | 'createPoll' | 'addLocation' | (string & {});
  ModalContent?: React.ComponentType<AttachmentSelectorModalContentProps>;
};

export const DefaultAttachmentSelectorComponents = {
  File({ closeMenu }: AttachmentSelectorActionProps) {
    const { t } = useTranslationContext();
    const { fileInput } = useAttachmentSelectorContext();
    const { isUploadEnabled } = useAttachmentManagerState();

    return (
      <DialogMenuButton
        className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__upload-file-button'
        disabled={!isUploadEnabled} // todo: add styles for disabled state
        onClick={() => {
          if (fileInput) fileInput.click();
          closeMenu();
        }}
      >
        {t('File')}
      </DialogMenuButton>
    );
  },
  Location({ closeMenu, openModalForAction }: AttachmentSelectorActionProps) {
    const { t } = useTranslationContext();
    return (
      <DialogMenuButton
        className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__add-location-button'
        onClick={() => {
          openModalForAction('addLocation');
          closeMenu();
        }}
      >
        {t('Location')}
      </DialogMenuButton>
    );
  },
  Poll({ closeMenu, openModalForAction }: AttachmentSelectorActionProps) {
    const { t } = useTranslationContext();
    return (
      <DialogMenuButton
        className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__create-poll-button'
        onClick={() => {
          openModalForAction('createPoll');
          closeMenu();
        }}
      >
        {t('Poll')}
      </DialogMenuButton>
    );
  },
};

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
        <button
          aria-expanded={menuDialogIsOpen}
          aria-haspopup='true'
          aria-label={t('aria/Open Attachment Selector')}
          className='str-chat__attachment-selector__menu-button'
          data-testid='invoke-attachment-selector-button'
          onClick={() => menuDialog?.toggle()}
          ref={menuButtonRef}
        >
          <AttachmentSelectorMenuInitButtonIcon />
        </button>
        <DialogAnchor
          dialogManagerId={dialogManager?.id}
          id={menuDialogId}
          placement='top-start'
          referenceElement={menuButtonRef.current}
          tabIndex={-1}
          trapFocus
        >
          <div
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
          </div>
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
