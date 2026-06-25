import React, {
  type ComponentType,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useAttachmentManagerState,
  useMessageComposerCommands,
  useMessageComposerController,
} from '../hooks';
import { CHANNEL_CONTAINER_ID } from '../../Channel/constants';
import {
  ContextMenu,
  ContextMenuButton,
  type ContextMenuHeaderComponent,
  type ContextMenuSubmenu,
  useContextMenuContext,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from '../../Dialog';
import { GlobalModal } from '../../Modal';
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
import { useInertWhenHidden } from '../../Accessibility';
import { useStateStore } from '../../../store';
import type { TextComposerState } from 'stream-chat';
import clsx from 'clsx';
import { Button, type ButtonProps } from '../../Button';
import {
  IconAttachment,
  IconCommand,
  IconLocation,
  IconPlus,
  IconPoll,
} from '../../Icons';
import { useIsCooldownActive } from '../hooks/useIsCooldownActive';
import {
  CommandsMenu,
  CommandsMenuClassName,
  CommandsSubmenuHeader,
} from './CommandsMenu';

const textComposerStateSelector = ({ command }: TextComposerState) => ({ command });

const AttachmentSelectorMenuInitButtonIcon = ({ className }: { className?: string }) => {
  const { AttachmentSelectorInitiationButtonContents } = useComponentContext();

  if (AttachmentSelectorInitiationButtonContents) {
    return (
      <span className={className}>
        <AttachmentSelectorInitiationButtonContents />
      </span>
    );
  }

  return (
    <IconPlus
      className={clsx('str-chat__attachment-selector__menu-button__icon', className)}
    />
  );
};

export const AttachmentSelectorButton = forwardRef<
  HTMLButtonElement,
  ButtonProps & { iconClassName?: string }
>(function AttachmentSelectorButton({ className, iconClassName, ...props }, ref) {
  return (
    <Button
      appearance='outline'
      circular
      className={clsx('str-chat__attachment-selector__menu-button', className)}
      data-testid='invoke-attachment-selector-button'
      size='lg'
      variant='secondary'
      {...props}
      ref={ref}
    >
      <AttachmentSelectorMenuInitButtonIcon className={iconClassName} />
    </Button>
  );
});

type SimpleAttachmentSelectorProps = {
  buttonProps?: Omit<ButtonProps, 'onClick'>;
};

export const SimpleAttachmentSelector = ({
  buttonProps,
}: SimpleAttachmentSelectorProps = {}) => {
  const { channelCapabilities } = useChannelStateContext();
  const { t } = useTranslationContext();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null);
  const id = useStableId();
  const isCooldownActive = useIsCooldownActive();
  const messageComposer = useMessageComposerController();
  const { command } = useStateStore(
    messageComposer.textComposer.state,
    textComposerStateSelector,
  );
  // Visually hidden via a CSS transition while a command is active; keep it out
  // of the a11y tree and tab order without setting `display: none`.
  const inertProps = useInertWhenHidden(!!command, { setHiddenAttribute: false });

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
    <div className='str-chat__attachment-selector' {...inertProps}>
      <AttachmentSelectorButton
        {...buttonProps}
        aria-label={t('aria/Open Attachment Selector')}
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

export type AttachmentSelectorAction = {
  ActionButton: ComponentType<AttachmentSelectorActionProps>;
  id?: string;
  ModalContent?: React.ComponentType<AttachmentSelectorModalContentProps>;
  Submenu?: ContextMenuSubmenu;
  Header?: ContextMenuHeaderComponent;
  type: 'uploadFile' | 'createPoll' | 'addLocation' | 'selectCommand' | (string & {});
};

export type AttachmentSelectorActionProps = {
  openModalForAction: (actionType: AttachmentSelectorAction['type']) => void;
  submenuItems?: ContextMenuSubmenu;
  submenuHeader?: ContextMenuHeaderComponent;
};

export const DefaultAttachmentSelectorComponents = {
  Command({ submenuHeader, submenuItems }: AttachmentSelectorActionProps) {
    const { t } = useTranslationContext();
    const { openSubmenu } = useContextMenuContext();
    const commands = useMessageComposerCommands();
    const hasEnabledCommands = commands.some(({ enabled }) => enabled);
    const hasSubmenu = !!submenuItems;

    return (
      <ContextMenuButton
        className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__commands-button'
        disabled={!hasEnabledCommands}
        hasSubMenu={hasSubmenu}
        Icon={IconCommand}
        onClick={(event) => {
          if (!hasSubmenu) return;
          openSubmenu({
            focusReturnTarget: event.currentTarget,
            Header: submenuHeader,
            menuClassName: CommandsMenuClassName,
            Submenu: submenuItems,
          });
        }}
      >
        {t('Commands')}
      </ContextMenuButton>
    );
  },
  File() {
    const { t } = useTranslationContext();
    const { fileInput } = useAttachmentSelectorContext();
    const { closeMenu } = useContextMenuContext();

    return (
      <ContextMenuButton
        className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__upload-file-button'
        Icon={IconAttachment}
        onClick={() => {
          fileInput?.click();
          closeMenu();
        }}
      >
        {t('File')}
      </ContextMenuButton>
    );
  },
  Location({ openModalForAction }: AttachmentSelectorActionProps) {
    const { t } = useTranslationContext();
    const { closeMenu } = useContextMenuContext();
    return (
      <ContextMenuButton
        className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__add-location-button'
        Icon={IconLocation}
        onClick={() => {
          openModalForAction('addLocation');
          closeMenu();
        }}
      >
        {t('Location')}
      </ContextMenuButton>
    );
  },
  Poll({ openModalForAction }: AttachmentSelectorActionProps) {
    const { t } = useTranslationContext();
    const { closeMenu } = useContextMenuContext();
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
  {
    ActionButton: DefaultAttachmentSelectorComponents.File,
    type: 'uploadFile',
  },
  {
    ActionButton: DefaultAttachmentSelectorComponents.Poll,
    type: 'createPoll',
  },
  {
    ActionButton: DefaultAttachmentSelectorComponents.Location,
    type: 'addLocation',
  },
  {
    ActionButton: DefaultAttachmentSelectorComponents.Command,
    Header: CommandsSubmenuHeader,
    Submenu: CommandsMenu,
    type: 'selectCommand',
  },
];

export type AttachmentSelectorProps = {
  attachmentSelectorActionSet?: AttachmentSelectorAction[];
  buttonProps?: Omit<ButtonProps, 'onClick'>;
  getModalPortalDestination?: () => HTMLElement | null;
};

const useAttachmentSelectorActionsFiltered = (original: AttachmentSelectorAction[]) => {
  const {
    PollCreationDialog = DefaultPollCreationDialog,
    ShareLocationDialog = DefaultLocationDialog,
  } = useComponentContext();
  const { channelCapabilities } = useChannelStateContext();
  const { isUploadEnabled } = useAttachmentManagerState();
  const messageComposer = useMessageComposerController();
  const channelConfig = messageComposer.channel.getConfig();

  return useMemo(
    () =>
      original
        .filter((action) => {
          if (action.type === 'uploadFile')
            return (
              channelCapabilities['upload-file'] &&
              channelConfig?.uploads &&
              isUploadEnabled
            );

          if (action.type === 'createPoll')
            return (
              channelCapabilities['send-poll'] &&
              !messageComposer.threadId &&
              channelConfig?.polls
            );

          if (action.type === 'addLocation') {
            return channelConfig?.shared_locations && !messageComposer.threadId;
          }

          if (action.type === 'selectCommand') {
            return !!channelConfig?.commands?.some((command) => !!command.name);
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
        }),
    [
      PollCreationDialog,
      ShareLocationDialog,
      channelCapabilities,
      channelConfig,
      isUploadEnabled,
      messageComposer.threadId,
      original,
    ],
  );
};

export const AttachmentSelector = ({
  attachmentSelectorActionSet = defaultAttachmentSelectorActionSet,
  buttonProps,
  getModalPortalDestination,
}: AttachmentSelectorProps) => {
  const { t } = useTranslationContext();
  const { ContextMenu: ContextMenuComponent = ContextMenu, Modal = GlobalModal } =
    useComponentContext();
  const { channelCapabilities } = useChannelStateContext();
  const messageComposer = useMessageComposerController();
  const isCooldownActive = useIsCooldownActive();
  const { command } = useStateStore(
    messageComposer.textComposer.state,
    textComposerStateSelector,
  );
  // The selector is visually hidden via a CSS transition while a command is
  // active; keep it out of the a11y tree and tab order without setting
  // `display: none` (which would break the transition).
  const inertProps = useInertWhenHidden(!!command, { setHiddenAttribute: false });
  const actions = useAttachmentSelectorActionsFiltered(attachmentSelectorActionSet);

  const menuDialogId = `attachment-actions-menu${messageComposer.threadId ? '-thread' : ''}`;
  const { dialog: menuDialog, dialogManager } = useDialogOnNearestManager({
    id: menuDialogId,
  });
  const menuDialogIsOpen = useDialogIsOpen(menuDialogId, dialogManager?.id);

  const [modalContentAction, setModalContentActionAction] =
    useState<AttachmentSelectorAction>();
  const shouldRestoreFocusToTriggerRef = useRef(false);
  const openModalForAction = useCallback(
    (actionType: AttachmentSelectorAction['type']) => {
      const action = actions.find((a) => a.type === actionType);
      if (!action?.ModalContent) return;
      // Reset composer state when the dialog is opened (not on close), so every
      // open starts from a fresh form without flashing cleared fields right
      // before the modal unmounts on cancel/submit.
      if (actionType === 'createPoll') {
        messageComposer.pollComposer.initState();
      }
      setModalContentActionAction(action);
    },
    [actions, messageComposer],
  );

  const closeModal = useCallback(() => {
    shouldRestoreFocusToTriggerRef.current = true;
    setModalContentActionAction(undefined);
  }, []);

  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (modalContentAction || !shouldRestoreFocusToTriggerRef.current) return;

    const frame = requestAnimationFrame(() => {
      shouldRestoreFocusToTriggerRef.current = false;
      // Only restore focus to the trigger if focus actually fell to <body> when the dialog closed
      // (the cancel/escape case). If the dialog content purposefully moved focus elsewhere — e.g.
      // the poll dialog returns focus to the composer on a successful send — leave it there. This
      // mirrors react-aria FocusScope's own restore guard and prevents a focus blip through the
      // trigger before the content's intended target.
      const active = document.activeElement;
      if (active && active !== document.body) return;
      menuButtonRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [modalContentAction]);

  const contextMenuItems = useMemo(
    () =>
      actions.map((action) => (
        <action.ActionButton
          key={action.type}
          openModalForAction={openModalForAction}
          submenuHeader={action.Header}
          submenuItems={action.Submenu}
        />
      )),
    [actions, openModalForAction],
  );

  const getDefaultPortalDestination = useCallback(
    () => document.getElementById(CHANNEL_CONTAINER_ID),
    [],
  );

  if (actions.length === 0) return null;

  if (actions.length === 1 && actions[0].type === 'uploadFile')
    return <SimpleAttachmentSelector buttonProps={buttonProps} />;

  const ModalContent = modalContentAction?.ModalContent;
  const modalIsOpen = !!ModalContent;
  return (
    <AttachmentSelectorContextProvider value={{ fileInput }}>
      <div className='str-chat__attachment-selector' {...inertProps}>
        {channelCapabilities['upload-file'] && <UploadFileInput ref={setFileInput} />}
        <AttachmentSelectorButton
          {...buttonProps}
          aria-expanded={menuDialogIsOpen}
          aria-haspopup='true'
          aria-label={t('aria/Open Attachment Selector')}
          disabled={isCooldownActive}
          iconClassName={clsx('str-chat__prepare-rotate45', {
            'str-chat__rotate45': menuDialogIsOpen,
          })}
          onClick={() => menuDialog?.toggle()}
          ref={menuButtonRef}
        />
        <ContextMenuComponent
          allowFlip
          aria-label={t('aria/Attachment Actions')}
          backLabel={t('Back')}
          className='str-chat__attachment-selector-actions-menu'
          data-testid='attachment-selector-actions-menu'
          dialogManagerId={dialogManager?.id}
          id={menuDialogId}
          onClose={menuDialog.close}
          placement='top-start'
          referenceElement={menuButtonRef.current}
          tabIndex={-1}
        >
          {contextMenuItems}
        </ContextMenuComponent>
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
            // Focus the dialog surface on open (not a field): a field's focus would supersede the
            // screen reader's dialog identity/description announcement. The user then presses Enter
            // to step into the dialog's default field (see GlobalModal's `[data-autofocus]`
            // handling).
            initialFocusStrategy='dialog'
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
