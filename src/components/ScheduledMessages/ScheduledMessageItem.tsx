import clsx from 'clsx';
import React, { type RefObject, useCallback, useRef, useState } from 'react';
import { nsToDate, SCHEDULED_MESSAGE_STATUS } from 'stream-chat';
import type { OwnCapabilitiesState, ScheduledMessageResponse } from 'stream-chat';

import {
  useChatContext,
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { ChannelAvatar } from '../Avatar';
import { Button } from '../Button';
import { useIsMounted } from '../Channel/hooks/useIsMounted';
import { useChannelPreviewInfo } from '../ChannelListItem/hooks/useChannelPreviewInfo';
import {
  Alert,
  ContextMenu,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from '../Dialog';
import { useSplitActionSet } from '../Chat/hooks/useSplitActionSet';
import { GlobalModal } from '../Modal';
import { useNotificationApi } from '../Notifications';
import { useStateStore } from '../../store';
import { SummarizedMessagePreview } from '../SummarizedMessagePreview';
import { useStableId } from '../UtilityComponents/useStableId';
import { VisuallyHidden } from '../VisuallyHidden';
import { SCHEDULE_MESSAGE_CAPABILITY } from './hooks';
import { useScheduledMessagePreview } from './hooks/useScheduledMessagePreview';
import { useRescheduleDialogProps } from './hooks/useRescheduleDialogProps';
import { ScheduleTimeDialog as DefaultScheduleTimeDialog } from './ScheduleTimeDialog';
import {
  defaultScheduledMessageActionSet,
  ScheduledMessageActionsContextProvider,
  useBaseScheduledMessageActionSetFilter,
  useScheduledMessageActionsContext,
} from './ScheduledMessageActions';
import type {
  ScheduledMessageActionsContextValue,
  ScheduledMessageActionSetItem,
  ScheduledMessageItemDialog,
} from './ScheduledMessageActions';
import {
  isFailedScheduledMessage,
  SCHEDULED_MESSAGE_NOTIFICATION_TYPE,
  SCHEDULED_MESSAGES_EMITTER,
  splitCid,
  translateScheduledMessageError,
  translateScheduledMessageFailureReason,
} from './utils';

export type ScheduledMessageItemProps = {
  scheduledMessage: ScheduledMessageResponse;
  /** Opens the message in the composer; without it the list offers no edit action. */
  openInComposer?: (scheduledMessage: ScheduledMessageResponse) => void;
  /**
   * The message's actions, in render order. Defaults to `defaultScheduledMessageActionSet`;
   * filter, reorder or extend it. Filtered by `useBaseScheduledMessageActionSetFilter`.
   */
  scheduledMessageActionSet?: ScheduledMessageActionSetItem[];
};

const selectComposeCapabilities = ({ ownCapabilities }: OwnCapabilitiesState) => ({
  canSchedule: !!ownCapabilities?.includes(SCHEDULE_MESSAGE_CAPABILITY),
  canSend: !!ownCapabilities?.includes('send-message'),
});

/** A scheduled message: when it is sent, where, its status and what can be done with it. */
export const ScheduledMessageItem = ({
  openInComposer,
  scheduledMessage,
  scheduledMessageActionSet = defaultScheduledMessageActionSet,
}: ScheduledMessageItemProps) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { IconExclamationTriangleFill, IconLoading } = useComponentContextIcons();
  const { Modal = GlobalModal, ScheduleTimeDialog = DefaultScheduleTimeDialog } =
    useComponentContext();
  const { addNotification } = useNotificationApi();
  const isMounted = useIsMounted();

  const { cid, failure_reason, id, scheduled_at, status } = scheduledMessage;
  // shown from a loaded channel only; an action creates the instance it needs
  const loadedChannel = client.channelManager.get(cid);
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel: loadedChannel,
  });
  const composeCapabilities = useStateStore(
    loadedChannel?.state,
    selectComposeCapabilities,
  );
  const editUnavailableId = useStableId();
  const getChannel = () => client.channel(...splitCid(cid));
  const previewMessage = useScheduledMessagePreview(scheduledMessage);
  const rescheduleDialogProps = useRescheduleDialogProps({
    previewMessage,
    scheduledMessage,
  });
  const sendTime = nsToDate(scheduled_at);
  const isFailed = isFailedScheduledMessage(scheduledMessage);
  // a pending message is saved by scheduling it, a failed one is scheduled or sent again; a frozen
  // channel allows neither. Unknown for a channel not loaded, so left on there.
  const canEdit =
    !composeCapabilities ||
    composeCapabilities.canSchedule ||
    (isFailed && composeCapabilities.canSend);

  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [openDialog, setOpenDialog] = useState<ScheduledMessageItemDialog>();
  const [isPending, setIsPending] = useState(false);

  const closeDialog = () => {
    setOpenDialog(undefined);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const runRequest: ScheduledMessageActionsContextValue['runRequest'] = async (
    request,
    failure,
    success,
  ) => {
    setIsPending(true);
    try {
      await request();
      if (success) {
        addNotification({
          emitter: SCHEDULED_MESSAGES_EMITTER,
          severity: 'success',
          ...success,
        });
      }
    } catch (error) {
      addNotification({
        emitter: SCHEDULED_MESSAGES_EMITTER,
        error: error as Error,
        severity: 'error',
        ...failure,
        message: translateScheduledMessageError(t, error) ?? failure.message,
      });
    } finally {
      if (isMounted.current) setIsPending(false);
    }
  };

  const deleteScheduledMessage = () => {
    closeDialog();
    void runRequest(() => getChannel().deleteScheduledMessage(id), {
      message: t(
        'scheduledMessages.couldntDeleteTheScheduledMessageTryAgain',
        "Couldn't delete the scheduled message. Try again",
      ),
      type: SCHEDULED_MESSAGE_NOTIFICATION_TYPE.deleteFailed,
    });
  };

  return (
    <div
      className={clsx('str-chat__scheduled-message-item', {
        'str-chat__scheduled-message-item--failed': isFailed,
      })}
      data-testid='scheduled-message-item'
    >
      <time
        className='str-chat__scheduled-message-item__time'
        dateTime={sendTime.toISOString()}
      >
        {t('scheduledMessages.sendTime', 'Send {{ time }}', {
          time: t('timestamp.ScheduledMessageSendTime', { timestamp: sendTime }),
        })}
      </time>
      <ScheduledMessageActionsContextProvider
        value={{
          canEdit,
          editUnavailableDescriptionId: editUnavailableId,
          isPending,
          openDialog: setOpenDialog,
          openInComposer,
          runRequest,
          scheduledMessage,
        }}
      >
        <ScheduledMessageItemActions
          menuButtonRef={menuButtonRef}
          scheduledMessageActionSet={scheduledMessageActionSet}
        />
      </ScheduledMessageActionsContextProvider>
      {!canEdit && (
        <VisuallyHidden id={editUnavailableId}>
          {t(
            'scheduledMessages.cantSendInThisChannel',
            "Unavailable: you can't send messages in this channel",
          )}
        </VisuallyHidden>
      )}
      <div className='str-chat__scheduled-message-item__body'>
        <ChannelAvatar
          aria-hidden='true'
          displayMembers={groupChannelDisplayInfo.members}
          imageUrl={displayImage}
          size='lg'
          userName={displayTitle}
        />
        <div className='str-chat__scheduled-message-item__content'>
          {displayTitle && (
            <span className='str-chat__scheduled-message-item__channel-name'>
              {displayTitle}
            </span>
          )}
          <SummarizedMessagePreview latestMessage={previewMessage} />
          {status === SCHEDULED_MESSAGE_STATUS.Failed && (
            <span className='str-chat__scheduled-message-item__status str-chat__scheduled-message-item__status--failed'>
              <IconExclamationTriangleFill className='str-chat__scheduled-message-item__status-icon' />
              {translateScheduledMessageFailureReason(t, failure_reason)}
            </span>
          )}
          {status === SCHEDULED_MESSAGE_STATUS.Sending && (
            <span className='str-chat__scheduled-message-item__status'>
              <IconLoading className='str-chat__scheduled-message-item__status-icon' />
              {t('scheduledMessages.sending', 'Sending...')}
            </span>
          )}
        </div>
      </div>
      <Modal
        className='str-chat__reschedule-message-modal'
        initialFocusStrategy='dialog'
        onClose={closeDialog}
        open={openDialog === 'reschedule'}
      >
        {openDialog === 'reschedule' && (
          <ScheduleTimeDialog
            channel={getChannel()}
            close={closeDialog}
            {...rescheduleDialogProps}
          />
        )}
      </Modal>
      <Modal
        className='str-chat__delete-scheduled-message-modal'
        onClose={closeDialog}
        open={openDialog === 'delete'}
        role='alertdialog'
      >
        {openDialog === 'delete' && (
          <Alert.Root
            className='str-chat__delete-scheduled-message-alert'
            data-testid='delete-scheduled-message-alert'
          >
            <Alert.Header
              description={
                displayTitle
                  ? t(
                      'scheduledMessages.thisMessageToNameWontBeSentThis',
                      "This message to {{ name }} won't be sent. This can't be undone.",
                      { name: displayTitle },
                    )
                  : t(
                      'scheduledMessages.thisMessageWontBeSentThisCantBe',
                      "This message won't be sent. This can't be undone.",
                    )
              }
              title={t(
                'scheduledMessages.deleteScheduledMessage',
                'Delete scheduled message?',
              )}
            />
            <Alert.Actions>
              <Button
                appearance='solid'
                onClick={deleteScheduledMessage}
                size='md'
                variant='danger'
              >
                {t('scheduledMessages.delete', 'Delete')}
              </Button>
              <Button
                appearance='outline'
                autoFocus
                onClick={closeDialog}
                size='md'
                variant='secondary'
              >
                {t('scheduledMessages.cancel', 'Cancel')}
              </Button>
            </Alert.Actions>
          </Alert.Root>
        )}
      </Modal>
    </div>
  );
};

/**
 * The `quick` actions beside the `quick-dropdown-toggle` item and the `dropdown` actions in the menu
 * it opens, with Delete set apart. Renders nothing when no quick or dropdown action passes the
 * filter.
 */
const ScheduledMessageItemActions = ({
  menuButtonRef,
  scheduledMessageActionSet,
}: {
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  scheduledMessageActionSet: ScheduledMessageActionSetItem[];
}) => {
  const { t } = useTranslationContext();
  const { ContextMenu: ContextMenuComponent = ContextMenu } = useComponentContext();
  const { scheduledMessage } = useScheduledMessageActionsContext();
  const actions = useBaseScheduledMessageActionSetFilter(scheduledMessageActionSet);
  const { dropdownActionSet, quickActionSet, quickDropdownToggleAction } =
    useSplitActionSet(actions);
  const menuId = `scheduled-message-actions-${scheduledMessage.id}`;
  const { dialog: menu, dialogManager } = useDialogOnNearestManager({ id: menuId });
  const isMenuOpen = useDialogIsOpen(menuId, dialogManager?.id);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(
    null,
  );
  // the item returns focus to the toggle when one of its dialogs closes
  const setToggle = useCallback(
    (element: HTMLButtonElement | null) => {
      menuButtonRef.current = element;
      setReferenceElement(element);
    },
    [menuButtonRef],
  );
  const hasMenu = !!quickDropdownToggleAction && dropdownActionSet.length > 0;

  if (!quickActionSet.length && !hasMenu) return null;

  return (
    <div
      className={clsx('str-chat__scheduled-message-actions', {
        'str-chat__scheduled-message-actions--active': isMenuOpen,
      })}
    >
      {hasMenu && (
        <quickDropdownToggleAction.Component
          aria-expanded={isMenuOpen}
          onClick={() => menu.toggle()}
          ref={setToggle}
        />
      )}
      {quickActionSet.map(({ Component, type }) => (
        <Component key={type} />
      ))}
      {hasMenu && (
        <ContextMenuComponent
          allowFlip
          aria-label={t(
            'scheduledMessages.scheduledMessageActions',
            'Scheduled message actions',
          )}
          className='str-chat__scheduled-message-actions-menu'
          data-testid='scheduled-message-actions-menu'
          dialogManagerId={dialogManager?.id}
          id={menuId}
          onClose={menu.close}
          placement='bottom-end'
          referenceElement={referenceElement}
          tabIndex={-1}
        >
          {dropdownActionSet.map(({ Component, type }, index) => (
            <React.Fragment key={type}>
              {/* Delete stands apart, unless it is the only action */}
              {type === 'delete' && index > 0 && (
                <div className='str-chat__context-menu__separator' role='separator' />
              )}
              <Component />
            </React.Fragment>
          ))}
        </ContextMenuComponent>
      )}
    </div>
  );
};
