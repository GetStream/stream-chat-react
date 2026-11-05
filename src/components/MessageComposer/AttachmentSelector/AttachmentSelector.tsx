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
  useComponentContext,
  useComponentContextIcons,
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
import { useIsCooldownActive } from '../hooks/useIsCooldownActive';
import {
  CommandsMenu,
  CommandsMenuClassName,
  CommandsSubmenuHeader,
} from './CommandsMenu';
import { useChannelCapabilities } from '../../Channel/hooks/useChannelCapabilities';
import type { ChannelConfig } from 'stream-chat';
import {
  type AttachmentSelectorActionAvailabilityContext,
  canUploadFiles,
  isAttachmentSelectorActionAvailable,
} from './attachmentSelectorActionAvailability';

const availableCommandsStateSelector = ({ availableCommands }: ChannelConfig) => ({
  availableCommands,
});

const textComposerStateSelector = ({ command }: TextComposerState) => ({ command });

/** Collects what the action availability rules read, subscribed so that a change re-renders. */
const useAttachmentSelectorActionAvailabilityContext =
  (): AttachmentSelectorActionAvailabilityContext => {
    const { attachmentsEnabled, customCdn, locationEnabled, pollsEnabled } =
      useAttachmentManagerState();
    const messageComposer = useMessageComposerController();
    const channelCapabilities = useChannelCapabilities({
      cid: messageComposer.channel.cid,
    });
    const { availableCommands } = useStateStore(
      messageComposer.channel.configState,
      availableCommandsStateSelector,
    );

    return useMemo(
      () => ({
        attachmentsEnabled,
        availableCommands,
        channelCapabilities,
        customCdn: !!customCdn,
        locationEnabled,
        messageComposer,
        pollsEnabled,
      }),
      [
        attachmentsEnabled,
        availableCommands,
        channelCapabilities,
        customCdn,
        locationEnabled,
        messageComposer,
        pollsEnabled,
      ],
    );
  };

const AttachmentSelectorMenuInitButtonIcon = ({ className }: { className?: string }) => {
  const { AttachmentSelectorInitiationButtonContents } = useComponentContext();
  const { IconPlus } = useComponentContextIcons();

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

export type AttachmentSelectorStandaloneButtonProps = {
  /**
   * The selector's `buttonProps`, with `disabled` replaced by whether the send cooldown is
   * active.
   */
  buttonProps?: Omit<ButtonProps, 'onClick'>;
};

type SimpleAttachmentSelectorProps = AttachmentSelectorStandaloneButtonProps;

/**
 * A button that opens the file picker, rendered whether or not uploads are available and
 * disabled once the message holds as many files as allowed. The default `StandaloneButton` of an
 * `uploadFile` action.
 */
export const FileUploadButton = ({
  buttonProps,
}: AttachmentSelectorStandaloneButtonProps) => {
  const { t } = useTranslationContext();
  const { hasAvailableUploadSlots } = useAttachmentManagerState();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null);
  const id = useStableId();

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

  return (
    <>
      <AttachmentSelectorButton
        {...buttonProps}
        aria-label={t(
          'messageComposer.attachmentSelector.openAttachmentSelector.ariaLabel',
          'Open Attachment Selector',
        )}
        disabled={buttonProps?.disabled || !hasAvailableUploadSlots}
        onClick={() => inputRef.current?.click()}
        ref={setButtonElement}
      />
      <UploadFileInput id={id} ref={inputRef} />
    </>
  );
};

/**
 * Renders a lone button in the selector's root element (`.str-chat__attachment-selector`), which
 * the composer layout sizes and hides while a command is active. The button is disabled during
 * the send cooldown.
 */
const StandaloneButtonSlot = ({
  buttonProps,
  StandaloneButton,
}: AttachmentSelectorStandaloneButtonProps & {
  StandaloneButton: ComponentType<AttachmentSelectorStandaloneButtonProps>;
}) => {
  const isCooldownActive = useIsCooldownActive();
  const messageComposer = useMessageComposerController();
  const { command } = useStateStore(
    messageComposer.textComposer.state,
    textComposerStateSelector,
  );
  // Hidden by a CSS transition while a command is active. Inert keeps it out of the a11y tree
  // and tab order without `display: none`, which would break the transition.
  const inertProps = useInertWhenHidden(!!command, { setHiddenAttribute: false });

  return (
    <div className='str-chat__attachment-selector' {...inertProps}>
      <StandaloneButton buttonProps={{ ...buttonProps, disabled: isCooldownActive }} />
    </div>
  );
};

/**
 * A single button that opens the file picker, rendered while files can be uploaded and disabled
 * once the message holds as many files as allowed.
 */
export const SimpleAttachmentSelector = ({
  buttonProps,
}: SimpleAttachmentSelectorProps = {}) => {
  const availabilityContext = useAttachmentSelectorActionAvailabilityContext();

  if (!canUploadFiles(availabilityContext)) return null;

  return (
    <StandaloneButtonSlot buttonProps={buttonProps} StandaloneButton={FileUploadButton} />
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
  /**
   * Rendered in place of the menu when this is the only action offered, inside the selector's
   * root element but with no menu or modal. Without it, a lone action is the only item of the
   * menu. An `uploadFile` action defaults to `FileUploadButton`.
   */
  StandaloneButton?: ComponentType<AttachmentSelectorStandaloneButtonProps>;
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
    const { IconCommand } = useComponentContextIcons();
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
        {t('messageComposer.attachmentSelector.commands.text', 'Commands')}
      </ContextMenuButton>
    );
  },
  File() {
    const { t } = useTranslationContext();
    const { IconAttachment } = useComponentContextIcons();
    const { fileInput } = useAttachmentSelectorContext();
    const { closeMenu } = useContextMenuContext();
    const { hasAvailableUploadSlots } = useAttachmentManagerState();

    return (
      <ContextMenuButton
        className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__upload-file-button'
        disabled={!hasAvailableUploadSlots}
        Icon={IconAttachment}
        onClick={() => {
          fileInput?.click();
          closeMenu();
        }}
      >
        {t('messageComposer.attachmentSelector.file.text', 'File')}
      </ContextMenuButton>
    );
  },
  Location({ openModalForAction }: AttachmentSelectorActionProps) {
    const { t } = useTranslationContext();
    const { IconLocation } = useComponentContextIcons();
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
        {t('common.location.text', 'Location')}
      </ContextMenuButton>
    );
  },
  Poll({ openModalForAction }: AttachmentSelectorActionProps) {
    const { t } = useTranslationContext();
    const { IconPoll } = useComponentContextIcons();
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
        {t('common.poll.label', 'Poll')}
      </ContextMenuButton>
    );
  },
};

/** Default actions of the attachment selector menu, listed from the top of the menu down. */
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
  const availabilityContext = useAttachmentSelectorActionAvailabilityContext();

  return useMemo(
    () =>
      original
        .filter((action) =>
          isAttachmentSelectorActionAvailable(action, availabilityContext),
        )
        .map((action) => {
          if (action.type === 'createPoll' && !action.ModalContent) {
            return { ...action, ModalContent: PollCreationDialog };
          }
          if (action.type === 'addLocation' && !action.ModalContent) {
            return { ...action, ModalContent: ShareLocationDialog };
          }
          if (action.type === 'uploadFile' && !action.StandaloneButton) {
            return { ...action, StandaloneButton: FileUploadButton };
          }
          return action;
        }),
    [PollCreationDialog, ShareLocationDialog, availabilityContext, original],
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
  const messageComposer = useMessageComposerController();
  const isCooldownActive = useIsCooldownActive();
  const { command } = useStateStore(
    messageComposer.textComposer.state,
    textComposerStateSelector,
  );
  // Hidden by a CSS transition while a command is active. Inert keeps it out of the a11y tree
  // and tab order without `display: none`, which would break the transition.
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
      // Reset on open, not on close, so each open starts from a fresh form and cleared fields
      // do not flash before the modal unmounts.
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

  const StandaloneButton = actions.length === 1 ? actions[0].StandaloneButton : undefined;
  const rendersMenu = actions.length > 0 && !StandaloneButton;

  // The modal belongs to the menu: it closes once the menu is not rendered or no longer offers
  // the modal's action, so it does not reappear when the menu returns.
  useEffect(() => {
    if (!modalContentAction) return;
    const modalActionIsOffered =
      rendersMenu && actions.some(({ type }) => type === modalContentAction.type);
    if (!modalActionIsOffered) setModalContentActionAction(undefined);
  }, [actions, modalContentAction, rendersMenu]);

  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (modalContentAction || !shouldRestoreFocusToTriggerRef.current) return;

    const frame = requestAnimationFrame(() => {
      shouldRestoreFocusToTriggerRef.current = false;
      // Restore focus to the trigger only if it fell to <body> when the dialog closed (cancel or
      // escape). When the content moved focus on purpose, e.g. the poll dialog returning it to
      // the composer after a send, leave it there so focus does not blip through the trigger.
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

  // The actions are already filtered by the availability rules, so the StandaloneButton renders
  // without checking availability again.
  if (StandaloneButton)
    return (
      <StandaloneButtonSlot
        buttonProps={buttonProps}
        StandaloneButton={StandaloneButton}
      />
    );

  const ModalContent = modalContentAction?.ModalContent;
  const modalIsOpen = !!ModalContent;
  return (
    <AttachmentSelectorContextProvider value={{ fileInput }}>
      <div className='str-chat__attachment-selector' {...inertProps}>
        <UploadFileInput ref={setFileInput} />
        <AttachmentSelectorButton
          {...buttonProps}
          aria-expanded={menuDialogIsOpen}
          aria-haspopup='true'
          aria-label={t(
            'messageComposer.attachmentSelector.openAttachmentSelector.ariaLabel',
            'Open Attachment Selector',
          )}
          disabled={isCooldownActive}
          iconClassName={clsx('str-chat__prepare-rotate45', {
            'str-chat__rotate45': menuDialogIsOpen,
          })}
          onClick={() => menuDialog?.toggle()}
          ref={menuButtonRef}
        />
        <ContextMenuComponent
          allowFlip
          aria-label={t(
            'messageComposer.attachmentSelector.attachmentActions.ariaLabel',
            'Attachment Actions',
          )}
          backLabel={t('common.back.label', 'Back')}
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
            // Focus the dialog surface on open, not a field: a field's focus would supersede the
            // screen reader's dialog announcement. Enter steps into the default field
            // (`[data-autofocus]`, handled by GlobalModal).
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
