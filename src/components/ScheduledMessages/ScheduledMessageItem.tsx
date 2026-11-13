import clsx from 'clsx';
import React, { useRef, useState } from 'react';
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
  ContextMenuButton,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from '../Dialog';
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
  getChannelByCid,
  getScheduledMessageActions,
  isFailedScheduledMessage,
  SCHEDULED_MESSAGE_NOTIFICATION_TYPE,
  SCHEDULED_MESSAGES_EMITTER,
  translateScheduledMessageError,
  translateScheduledMessageFailureReason,
} from './utils';
import type { ScheduledMessageAction } from './utils';

export type ScheduledMessageItemProps = {
  scheduledMessage: ScheduledMessageResponse;
  /** Opens the message in the composer; without it the list offers no edit action. */
  onEdit?: (scheduledMessage: ScheduledMessageResponse) => void;
};

type OpenDialog = 'delete' | 'reschedule';

const selectComposeCapabilities = ({ ownCapabilities }: OwnCapabilitiesState) => ({
  canSchedule: !!ownCapabilities?.includes(SCHEDULE_MESSAGE_CAPABILITY),
  canSend: !!ownCapabilities?.includes('send-message'),
});

/** A scheduled message: when it is sent, where, its status and what can be done with it. */
export const ScheduledMessageItem = ({
  onEdit,
  scheduledMessage,
}: ScheduledMessageItemProps) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const {
    IconClock,
    IconCopy,
    IconDelete,
    IconEdit,
    IconExclamationTriangleFill,
    IconLoading,
    IconMore,
    IconSend,
  } = useComponentContextIcons();
  const {
    ContextMenu: ContextMenuComponent = ContextMenu,
    Modal = GlobalModal,
    ScheduleTimeDialog = DefaultScheduleTimeDialog,
  } = useComponentContext();
  const { addNotification } = useNotificationApi();
  const isMounted = useIsMounted();

  const { cid, failure_reason, id, message, scheduled_at, status } = scheduledMessage;
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
  const getChannel = () => getChannelByCid(client, cid);
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
  const editUnavailableProps = canEdit
    ? undefined
    : { 'aria-describedby': editUnavailableId, 'aria-disabled': true };

  const menuId = `scheduled-message-actions-${id}`;
  const { dialog: menu, dialogManager } = useDialogOnNearestManager({ id: menuId });
  const isMenuOpen = useDialogIsOpen(menuId, dialogManager?.id);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [openDialog, setOpenDialog] = useState<OpenDialog>();
  const [isPending, setIsPending] = useState(false);

  const actions = getScheduledMessageActions(scheduledMessage, !!onEdit);
  // a pending message keeps "edit" as its own button, outside the menu
  const hasEditButton = !isFailed && actions.includes('edit');
  const menuActions = hasEditButton
    ? actions.filter((action) => action !== 'edit')
    : actions;

  const closeDialog = () => {
    setOpenDialog(undefined);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const run = async (
    request: () => Promise<unknown>,
    failure: { message: string; type: string },
    success?: { message: string; type: string },
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

  const menuItems: Record<
    ScheduledMessageAction,
    { Icon: typeof IconClock; label: string; select: () => void }
  > = {
    copy: {
      Icon: IconCopy,
      label: t('scheduledMessages.copyText', 'Copy text'),
      select: () =>
        navigator.clipboard?.writeText(message.text ?? '').catch(() => undefined),
    },
    delete: {
      Icon: IconDelete,
      label: t('scheduledMessages.delete', 'Delete'),
      select: () => setOpenDialog('delete'),
    },
    edit: {
      Icon: IconEdit,
      label: t('scheduledMessages.editReschedule', 'Edit & reschedule'),
      select: () => onEdit?.(scheduledMessage),
    },
    reschedule: {
      Icon: IconClock,
      label: t('scheduledMessages.reschedule', 'Reschedule'),
      select: () => setOpenDialog('reschedule'),
    },
    send_now: {
      Icon: IconSend,
      label: t('scheduledMessages.sendNow', 'Send now'),
      select: () =>
        run(
          () => getChannel().sendScheduledMessageNow(id),
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
        ),
    },
  };

  const deleteScheduledMessage = () => {
    closeDialog();
    void run(() => getChannel().deleteScheduledMessage(id), {
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
      <div
        className={clsx('str-chat__scheduled-message-actions', {
          'str-chat__scheduled-message-actions--active': isMenuOpen,
        })}
      >
        <Button
          appearance='ghost'
          aria-expanded={isMenuOpen}
          aria-haspopup='menu'
          aria-label={t(
            'scheduledMessages.openScheduledMessageActions.ariaLabel',
            'Open scheduled message actions',
          )}
          circular
          className='str-chat__scheduled-message-actions-button'
          data-testid='scheduled-message-actions-button'
          disabled={!menuActions.length || isPending}
          onClick={() => menu.toggle()}
          ref={menuButtonRef}
          size='xs'
          variant='secondary'
        >
          <IconMore />
        </Button>
        {hasEditButton && (
          <Button
            appearance='ghost'
            aria-label={t('scheduledMessages.edit', 'Edit')}
            circular
            className='str-chat__scheduled-message-actions-button'
            data-testid='scheduled-message-edit-button'
            disabled={isPending}
            {...editUnavailableProps}
            onClick={() => {
              if (canEdit) onEdit?.(scheduledMessage);
            }}
            size='xs'
            variant='secondary'
          >
            <IconEdit />
          </Button>
        )}
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
          referenceElement={menuButtonRef.current}
          tabIndex={-1}
        >
          {menuActions.map((action, index) => {
            const { Icon, label, select } = menuItems[action];
            const isDelete = action === 'delete';
            return (
              <React.Fragment key={action}>
                {/* Delete stands apart, unless it is the only action */}
                {isDelete && index > 0 && (
                  <div className='str-chat__context-menu__separator' role='separator' />
                )}
                <ContextMenuButton
                  data-testid={`scheduled-message-action-${action}`}
                  Icon={Icon}
                  // still focusable, so the reason it is unavailable can be read
                  {...(action === 'edit' && editUnavailableProps)}
                  onClick={() => {
                    if (action === 'edit' && !canEdit) return;
                    menu.close();
                    select();
                  }}
                  variant={isDelete ? 'destructive' : undefined}
                >
                  {label}
                </ContextMenuButton>
              </React.Fragment>
            );
          })}
        </ContextMenuComponent>
      </div>
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
