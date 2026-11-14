import React, {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react';
import { SCHEDULED_MESSAGE_FAILURE_REASON, SCHEDULED_MESSAGE_STATUS } from 'stream-chat';
import type { ScheduledMessageResponse } from 'stream-chat';

import {
  useChatContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { Button } from '../Button';
import { ContextMenuButton, useContextMenuContext } from '../Dialog';
import { useNotificationApi } from '../Notifications';
import {
  isFailedScheduledMessage,
  SCHEDULED_MESSAGE_NOTIFICATION_TYPE,
  SCHEDULED_MESSAGES_EMITTER,
  splitCid,
} from './utils';

export type DefaultScheduledMessageActionType =
  | 'copyMessageText'
  | 'delete'
  | 'edit'
  | 'reschedule'
  | 'sendNow';

/** A dialog a scheduled message's action opens: the Delete confirmation or the time picker. */
export type ScheduledMessageItemDialog = 'delete' | 'reschedule';

/** A notification an action raises: its text and type. */
export type ScheduledMessageActionNotification = { message: string; type: string };

/** What the actions of one scheduled message read; provided by `ScheduledMessageItem`. */
export type ScheduledMessageActionsContextValue = {
  /**
   * Whether the message's channel lets the user schedule it (or send a failed one again). Unknown
   * for a channel that is not loaded, and then `true`. The default edit actions stay focusable but
   * do nothing while it is `false`, described by `editUnavailableDescriptionId`.
   */
  canEdit: boolean;
  /** The ID of the element that says why editing is unavailable. */
  editUnavailableDescriptionId: string;
  /** A request of this message's actions is running. */
  isPending: boolean;
  /** Opens one of the item's dialogs. */
  openDialog: (dialog: ScheduledMessageItemDialog) => void;
  /**
   * Runs a request for the message, marked pending meanwhile. A failure is reported as an error
   * notification, translated from the error where possible; a success only when given.
   */
  runRequest: (
    request: () => Promise<unknown>,
    failure: ScheduledMessageActionNotification,
    success?: ScheduledMessageActionNotification,
  ) => Promise<void>;
  scheduledMessage: ScheduledMessageResponse;
  /** Opens the message in the composer; without it no edit action is offered. */
  openInComposer?: (scheduledMessage: ScheduledMessageResponse) => void;
};

const ScheduledMessageActionsContext = createContext<
  ScheduledMessageActionsContextValue | undefined
>(undefined);

export const ScheduledMessageActionsContextProvider = ({
  children,
  value,
}: PropsWithChildren<{ value: ScheduledMessageActionsContextValue }>) => (
  <ScheduledMessageActionsContext.Provider value={value}>
    {children}
  </ScheduledMessageActionsContext.Provider>
);

export const useScheduledMessageActionsContext = () => {
  const value = useContext(ScheduledMessageActionsContext);
  if (!value) {
    throw new Error(
      'useScheduledMessageActionsContext must be used within ScheduledMessageItem',
    );
  }
  return value;
};

/** What an action's `isVisible` rule is checked against. */
export type ScheduledMessageActionVisibilityFilterParams = {
  scheduledMessage: ScheduledMessageResponse;
};

type BaseScheduledMessageActionSetItem = {
  /**
   * Hides the action for a message, e.g. `copyMessageText` without a clipboard. Cannot show an
   * action the base filter removes (by the message's status, or `edit` without `openInComposer`). Shown
   * when omitted.
   */
  isVisible?: (state: ScheduledMessageActionVisibilityFilterParams) => boolean;
  type: DefaultScheduledMessageActionType | (string & {});
};

/** Rendered as a button beside the actions menu's toggle. */
export type QuickScheduledMessageActionSetItem = BaseScheduledMessageActionSetItem & {
  Component: React.ComponentType;
  placement: 'quick';
};

/**
 * Rendered inside the actions menu, so the component can close it with `closeMenu` from
 * `useContextMenuContext()`.
 */
export type DropdownScheduledMessageActionSetItem = BaseScheduledMessageActionSetItem & {
  Component: React.ComponentType;
  placement: 'dropdown';
};

/**
 * The button that opens the actions menu, rendered while at least one `dropdown` item passes the
 * filter. A `forwardRef` component that spreads the props it gets onto its button: the menu anchors
 * to the ref and the props open it.
 */
export type QuickDropdownToggleScheduledMessageActionSetItem = {
  Component: React.ForwardRefExoticComponent<
    ComponentPropsWithoutRef<'button'> & React.RefAttributes<HTMLButtonElement>
  >;
  placement: 'quick-dropdown-toggle';
};

export type ScheduledMessageActionSetItem =
  | QuickScheduledMessageActionSetItem
  | DropdownScheduledMessageActionSetItem
  | QuickDropdownToggleScheduledMessageActionSetItem;

/** The built-in action types each status allows; a type of another name is not restricted. */
const getAllowedDefaultActionTypes = ({
  failure_reason,
  status,
}: ScheduledMessageResponse): DefaultScheduledMessageActionType[] => {
  if (status === SCHEDULED_MESSAGE_STATUS.Sending) return [];
  if (status !== SCHEDULED_MESSAGE_STATUS.Failed) {
    return ['edit', 'reschedule', 'sendNow', 'delete'];
  }
  // a message to a deleted channel can only be copied before it goes
  return failure_reason === SCHEDULED_MESSAGE_FAILURE_REASON.ChannelDeleted
    ? ['copyMessageText', 'delete']
    : ['edit', 'delete'];
};

const DEFAULT_ACTION_TYPES: ReadonlySet<string> =
  new Set<DefaultScheduledMessageActionType>([
    'copyMessageText',
    'delete',
    'edit',
    'reschedule',
    'sendNow',
  ]);

/**
 * Drops the actions a scheduled message's status rules out: none while it is sending; edit,
 * reschedule, send now and delete while it waits; edit and delete once it failed, or copy and
 * delete once its channel was deleted. `edit` also needs `openInComposer`. An action of another type passes
 * these rules. An action they allow still shows only while its own `isVisible` holds. The menu
 * toggle is always kept. Reads the message from `useScheduledMessageActionsContext()`.
 *
 * @param scheduledMessageActionSet - Actions to filter.
 * @returns The actions to show.
 */
export const useBaseScheduledMessageActionSetFilter = (
  scheduledMessageActionSet: ScheduledMessageActionSetItem[],
) => {
  const { openInComposer, scheduledMessage } = useScheduledMessageActionsContext();
  const canOpenInComposer = !!openInComposer;

  return useMemo(() => {
    const allowedTypes = getAllowedDefaultActionTypes(scheduledMessage);
    const visibilityFilterParams: ScheduledMessageActionVisibilityFilterParams = {
      scheduledMessage,
    };

    const passesBaseRule = ({ type }: { type: string }) =>
      !DEFAULT_ACTION_TYPES.has(type) ||
      (allowedTypes.includes(type as DefaultScheduledMessageActionType) &&
        (type !== 'edit' || canOpenInComposer));

    return scheduledMessageActionSet.filter(
      (action) =>
        action.placement === 'quick-dropdown-toggle' ||
        (passesBaseRule(action) &&
          (!action.isVisible || action.isVisible(visibilityFilterParams))),
    );
  }, [canOpenInComposer, scheduledMessage, scheduledMessageActionSet]);
};

/** Keeps an unavailable edit action focusable, so the reason it is unavailable can be read. */
const useEditActionProps = () => {
  const { canEdit, editUnavailableDescriptionId, openInComposer, scheduledMessage } =
    useScheduledMessageActionsContext();
  return {
    edit: () => {
      if (canEdit) openInComposer?.(scheduledMessage);
    },
    unavailableProps: canEdit
      ? undefined
      : {
          'aria-describedby': editUnavailableDescriptionId,
          'aria-disabled': true as const,
        },
  };
};

const QuickDropdownToggle = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<'button'>
>(function QuickDropdownToggle(props, ref) {
  const { t } = useTranslationContext();
  const { IconMore } = useComponentContextIcons();
  const { isPending } = useScheduledMessageActionsContext();
  return (
    <Button
      appearance='ghost'
      aria-haspopup='menu'
      aria-label={t(
        'scheduledMessages.openScheduledMessageActions.ariaLabel',
        'Open scheduled message actions',
      )}
      circular
      className='str-chat__scheduled-message-actions-button'
      data-testid='scheduled-message-actions-button'
      disabled={isPending}
      ref={ref}
      size='xs'
      variant='secondary'
      {...props}
    >
      <IconMore />
    </Button>
  );
});

const QuickEdit = () => {
  const { t } = useTranslationContext();
  const { IconEdit } = useComponentContextIcons();
  const { isPending } = useScheduledMessageActionsContext();
  const { edit, unavailableProps } = useEditActionProps();
  return (
    <Button
      appearance='ghost'
      aria-label={t('scheduledMessages.edit', 'Edit')}
      circular
      className='str-chat__scheduled-message-actions-button'
      data-testid='scheduled-message-edit-button'
      disabled={isPending}
      {...unavailableProps}
      onClick={edit}
      size='xs'
      variant='secondary'
    >
      <IconEdit />
    </Button>
  );
};

const DropdownEdit = () => {
  const { t } = useTranslationContext();
  const { IconEdit } = useComponentContextIcons();
  const { closeMenu } = useContextMenuContext();
  const { canEdit } = useScheduledMessageActionsContext();
  const { edit, unavailableProps } = useEditActionProps();
  return (
    <ContextMenuButton
      data-testid='scheduled-message-action-edit'
      Icon={IconEdit}
      {...unavailableProps}
      onClick={() => {
        if (!canEdit) return;
        closeMenu();
        edit();
      }}
    >
      {t('scheduledMessages.editReschedule', 'Edit & reschedule')}
    </ContextMenuButton>
  );
};

const DropdownReschedule = () => {
  const { t } = useTranslationContext();
  const { IconClock } = useComponentContextIcons();
  const { closeMenu } = useContextMenuContext();
  const { openDialog } = useScheduledMessageActionsContext();
  return (
    <ContextMenuButton
      data-testid='scheduled-message-action-reschedule'
      Icon={IconClock}
      onClick={() => {
        closeMenu();
        openDialog('reschedule');
      }}
    >
      {t('scheduledMessages.reschedule', 'Reschedule')}
    </ContextMenuButton>
  );
};

const DropdownSendNow = () => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { IconSend } = useComponentContextIcons();
  const { closeMenu } = useContextMenuContext();
  const { runRequest, scheduledMessage } = useScheduledMessageActionsContext();
  return (
    <ContextMenuButton
      data-testid='scheduled-message-action-sendNow'
      Icon={IconSend}
      onClick={() => {
        closeMenu();
        void runRequest(
          () =>
            client
              .channel(...splitCid(scheduledMessage.cid))
              .sendScheduledMessageNow(scheduledMessage.id),
          {
            message: t(
              'scheduledMessages.couldntSendTheMessageTryAgain',
              "Couldn't send the message. Try again",
            ),
            type: SCHEDULED_MESSAGE_NOTIFICATION_TYPE.sendNowFailed,
          },
          {
            message: t(
              'scheduledMessages.scheduledMessageSent',
              'Scheduled message sent',
            ),
            type: SCHEDULED_MESSAGE_NOTIFICATION_TYPE.sendNowSucceeded,
          },
        );
      }}
    >
      {t('scheduledMessages.sendNow', 'Send now')}
    </ContextMenuButton>
  );
};

const DropdownCopyMessageText = () => {
  const { t } = useTranslationContext();
  const { IconCopy } = useComponentContextIcons();
  const { closeMenu } = useContextMenuContext();
  const { addNotification } = useNotificationApi();
  const { scheduledMessage } = useScheduledMessageActionsContext();
  return (
    <ContextMenuButton
      data-testid='scheduled-message-action-copyMessageText'
      Icon={IconCopy}
      onClick={() => {
        closeMenu();
        // reported, as copying may be the only way to keep the text of a message that can't be sent
        navigator.clipboard
          .writeText(scheduledMessage.message.text ?? '')
          .catch((error: unknown) =>
            addNotification({
              emitter: SCHEDULED_MESSAGES_EMITTER,
              error: error instanceof Error ? error : new Error(String(error)),
              message: t(
                'scheduledMessages.couldntCopyTheText',
                "Couldn't copy the text",
              ),
              severity: 'error',
              type: SCHEDULED_MESSAGE_NOTIFICATION_TYPE.copyFailed,
            }),
          );
      }}
    >
      {t('scheduledMessages.copyText', 'Copy text')}
    </ContextMenuButton>
  );
};

const DropdownDelete = () => {
  const { t } = useTranslationContext();
  const { IconDelete } = useComponentContextIcons();
  const { closeMenu } = useContextMenuContext();
  const { openDialog } = useScheduledMessageActionsContext();
  return (
    <ContextMenuButton
      data-testid='scheduled-message-action-delete'
      Icon={IconDelete}
      onClick={() => {
        closeMenu();
        openDialog('delete');
      }}
      variant='destructive'
    >
      {t('scheduledMessages.delete', 'Delete')}
    </ContextMenuButton>
  );
};

export const DefaultScheduledMessageActionComponents = {
  dropdown: {
    CopyMessageText: DropdownCopyMessageText,
    Delete: DropdownDelete,
    Edit: DropdownEdit,
    Reschedule: DropdownReschedule,
    SendNow: DropdownSendNow,
  },
  quick: {
    DropdownToggle: QuickDropdownToggle,
    Edit: QuickEdit,
  },
};

/**
 * The actions `ScheduledMessageItem` renders by default. A waiting message is edited from its own
 * button and the rest from the menu; a failed one is edited ("Edit & reschedule") from the menu.
 * Each item's `isVisible` holds the action's own rule; the message's status is checked by
 * `useBaseScheduledMessageActionSetFilter` and cannot be overridden.
 */
export const defaultScheduledMessageActionSet: ScheduledMessageActionSetItem[] = [
  {
    Component: DefaultScheduledMessageActionComponents.quick.DropdownToggle,
    placement: 'quick-dropdown-toggle',
  },
  {
    Component: DefaultScheduledMessageActionComponents.quick.Edit,
    isVisible: ({ scheduledMessage }) => !isFailedScheduledMessage(scheduledMessage),
    placement: 'quick',
    type: 'edit',
  },
  {
    Component: DefaultScheduledMessageActionComponents.dropdown.Edit,
    isVisible: ({ scheduledMessage }) => isFailedScheduledMessage(scheduledMessage),
    placement: 'dropdown',
    type: 'edit',
  },
  {
    Component: DefaultScheduledMessageActionComponents.dropdown.Reschedule,
    placement: 'dropdown',
    type: 'reschedule',
  },
  {
    Component: DefaultScheduledMessageActionComponents.dropdown.SendNow,
    placement: 'dropdown',
    type: 'sendNow',
  },
  {
    Component: DefaultScheduledMessageActionComponents.dropdown.CopyMessageText,
    // nothing to copy, or nowhere to copy it to (an insecure page, or no Clipboard API)
    isVisible: ({ scheduledMessage }) =>
      !!scheduledMessage.message.text &&
      typeof navigator !== 'undefined' &&
      !!navigator.clipboard,
    placement: 'dropdown',
    type: 'copyMessageText',
  },
  {
    Component: DefaultScheduledMessageActionComponents.dropdown.Delete,
    placement: 'dropdown',
    type: 'delete',
  },
];
