import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, PointerEvent as ReactPointerEvent, SetStateAction } from 'react';
import type { NotificationSeverity } from 'stream-chat';
import {
  addNotificationTargetTag,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  Button,
  DialogAnchor,
  IconArrowRotateRightLeftRepeatRefresh,
  IconArrowUp,
  IconCheckmark2,
  IconCircleInfoTooltip,
  IconClock,
  IconCrossMedium,
  IconExclamationCircle,
  IconExclamationTriangle,
  IconPlusSmall,
  NumericInput,
  Prompt,
  TextInput,
  useChatContext,
  useDialogIsOpen,
  useDialogOnNearestManager,
  type NotificationListEnterFrom,
  type NotificationTargetPanel,
} from 'stream-chat-react';
import {
  buildNotificationActions,
  entryDirectionOptions,
  initialDraft,
  isDraftReady,
  parseDuration,
  severityOptions,
  targetPanelOptions,
  type NotificationDraft,
  type QueuedNotification,
} from './triggerNotificationUtils';

export const notificationPromptDialogId = 'app-notification-prompt-dialog';

const VIEWPORT_MARGIN = 8;

const clamp = (value: number, min: number, max: number) => {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
};

const severityIcons: Partial<
  Record<NotificationSeverity, React.ComponentType<{ className?: string }>>
> = {
  error: IconExclamationCircle,
  info: IconCircleInfoTooltip,
  loading: IconArrowRotateRightLeftRepeatRefresh,
  success: IconCheckmark2,
  warning: IconExclamationTriangle,
};

const directionIcons: Record<
  NotificationListEnterFrom,
  React.ComponentType<{ className?: string }>
> = {
  bottom: IconArrowUp,
  left: IconArrowRight,
  right: IconArrowLeft,
  top: IconArrowDown,
};

const formatDurationLabel = (duration: number) => {
  if (duration === 0) return 'manual';
  if (duration < 1000) return `${duration}ms`;
  if (duration % 1000 === 0) return `${duration / 1000}s`;
  return `${(duration / 1000).toFixed(1)}s`;
};

const NotificationEntrySelect = ({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  value: string;
}) => (
  <label className='app__notification-dialog__field'>
    <span className='app__notification-dialog__field-label'>{label}</span>
    <select
      className='app__notification-dialog__select'
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

const NotificationChipList = ({
  notifications,
  removeQueuedNotification,
}: {
  notifications: QueuedNotification[];
  removeQueuedNotification: (id: string) => void;
}) => (
  <div className='app__notification-dialog__chips' role='list'>
    {notifications.map((notification) => {
      const SeverityIcon = severityIcons[notification.severity];
      const DirectionIcon = directionIcons[notification.entryDirection];

      return (
        <div
          className='app__notification-dialog__chip'
          key={notification.id}
          role='listitem'
          title={notification.message}
        >
          {SeverityIcon && (
            <SeverityIcon className='app__notification-dialog__chip-icon' />
          )}
          <span className='app__notification-dialog__chip-text'>
            {notification.message}
          </span>
          <span className='app__notification-dialog__chip-meta'>
            <span className='app__notification-dialog__chip-meta-item'>
              <IconClock className='app__notification-dialog__chip-meta-icon' />
              {formatDurationLabel(notification.duration)}
            </span>
            <span className='app__notification-dialog__chip-meta-item'>
              <DirectionIcon className='app__notification-dialog__chip-meta-icon' />
              {notification.entryDirection}
            </span>
            <span className='app__notification-dialog__chip-panel'>
              {notification.targetPanel}
            </span>
          </span>
          <Button
            appearance='ghost'
            aria-label={`Remove ${notification.message}`}
            circular
            className='app__notification-dialog__chip-remove'
            onClick={() => removeQueuedNotification(notification.id)}
            size='xs'
            variant='secondary'
          >
            <IconCrossMedium />
          </Button>
        </div>
      );
    })}
  </div>
);

const NotificationDraftForm = ({
  draft,
  queueCurrentDraft,
  queuedNotifications,
  registerQueuedNotifications,
  removeQueuedNotification,
  setDraft,
}: {
  draft: NotificationDraft;
  queueCurrentDraft: () => void;
  queuedNotifications: QueuedNotification[];
  registerQueuedNotifications: () => void;
  removeQueuedNotification: (id: string) => void;
  setDraft: Dispatch<SetStateAction<NotificationDraft>>;
}) => {
  const canQueueCurrentDraft = isDraftReady(draft);

  return (
    <>
      <Prompt.Body className='app__notification-dialog__body'>
        <div className='app__notification-dialog__body-content'>
          <div className='app__notification-dialog__form-grid'>
            <TextInput
              className='app__notification-dialog__text-input'
              label='Message'
              onChange={(event) =>
                setDraft((current) => ({ ...current, message: event.target.value }))
              }
              placeholder='Notification message'
              value={draft.message}
            />
            <NotificationEntrySelect
              label='Severity'
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  severity: value as NotificationSeverity,
                }))
              }
              options={severityOptions}
              value={draft.severity}
            />
            <label className='app__notification-dialog__field'>
              <span className='app__notification-dialog__field-label'>Duration (ms)</span>
              <NumericInput
                min={0}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, duration: event.target.value }))
                }
                value={draft.duration}
              />
            </label>
            <NotificationEntrySelect
              label='Entry Direction'
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  entryDirection: value as NotificationListEnterFrom,
                }))
              }
              options={entryDirectionOptions}
              value={draft.entryDirection}
            />
            <NotificationEntrySelect
              label='Target Panel'
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  targetPanel: value as NotificationTargetPanel,
                }))
              }
              options={targetPanelOptions}
              value={draft.targetPanel}
            />
            <TextInput
              className='app__notification-dialog__text-input'
              label='Action Label (optional)'
              onChange={(event) =>
                setDraft((current) => ({ ...current, actionLabel: event.target.value }))
              }
              placeholder='Optional button label'
              value={draft.actionLabel}
            />
            <TextInput
              className='app__notification-dialog__text-input app__notification-dialog__text-input--wide'
              label='Action Follow-up Message (optional)'
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  actionFeedback: event.target.value,
                }))
              }
              placeholder='Optional notification triggered by the action button'
              value={draft.actionFeedback}
            />
          </div>
        </div>
      </Prompt.Body>
      <Prompt.Footer className='app__notification-dialog__footer'>
        <div className='app__notification-dialog__footer-leading'>
          <div className='app__notification-dialog__queue-controls'>
            <button
              aria-label='Queue notification'
              className='app__notification-dialog__queue-trigger'
              disabled={!canQueueCurrentDraft}
              onClick={queueCurrentDraft}
              type='button'
            >
              <span className='app__notification-dialog__queue-button'>
                <IconPlusSmall
                  className={
                    canQueueCurrentDraft
                      ? 'app__notification-dialog__queue-button-icon app__notification-dialog__queue-button-icon--enabled'
                      : 'app__notification-dialog__queue-button-icon'
                  }
                />
              </span>
              <span className='app__notification-dialog__queue-hint'>
                Add the current notification to the queue
              </span>
            </button>
          </div>
          <NotificationChipList
            notifications={queuedNotifications}
            removeQueuedNotification={removeQueuedNotification}
          />
        </div>
        <Prompt.FooterControls className='app__notification-dialog__footer-controls'>
          <Prompt.FooterControlsButtonPrimary
            disabled={queuedNotifications.length === 0}
            onClick={registerQueuedNotifications}
          >
            Ok
          </Prompt.FooterControlsButtonPrimary>
        </Prompt.FooterControls>
      </Prompt.Footer>
    </>
  );
};

export const NotificationPromptDialog = ({
  referenceElement,
}: {
  referenceElement: HTMLElement | null;
}) => {
  const [draft, setDraft] = useState(initialDraft);
  const [queuedNotifications, setQueuedNotifications] = useState<QueuedNotification[]>(
    [],
  );
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const chipIdRef = useRef(0);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const { client } = useChatContext();
  const { dialog, dialogManager } = useDialogOnNearestManager({
    id: notificationPromptDialogId,
  });
  const dialogIsOpen = useDialogIsOpen(notificationPromptDialogId, dialogManager?.id);

  const resetState = useCallback(() => {
    setDraft(initialDraft);
    setQueuedNotifications([]);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (dialogIsOpen) return;
    resetState();
  }, [dialogIsOpen, resetState]);

  useEffect(() => {
    if (!dialogIsOpen) return;

    const clampToViewport = () => {
      const shell = shellRef.current;
      if (!shell) return;

      const rect = shell.getBoundingClientRect();
      const nextLeft = clamp(
        rect.left,
        VIEWPORT_MARGIN,
        window.innerWidth - rect.width - VIEWPORT_MARGIN,
      );
      const nextTop = clamp(
        rect.top,
        VIEWPORT_MARGIN,
        window.innerHeight - rect.height - VIEWPORT_MARGIN,
      );

      if (nextLeft === rect.left && nextTop === rect.top) return;

      setDragOffset((current) => ({
        x: current.x + (nextLeft - rect.left),
        y: current.y + (nextTop - rect.top),
      }));
    };

    window.addEventListener('resize', clampToViewport);

    return () => {
      window.removeEventListener('resize', clampToViewport);
    };
  }, [dialogIsOpen]);

  const closeDialog = useCallback(() => {
    dialog.close();
  }, [dialog]);

  const addNotification = useCallback(
    (notification: QueuedNotification) => {
      client.notifications.add({
        message: notification.message,
        origin: {
          context: {
            entryDirection: notification.entryDirection,
            panel: notification.targetPanel,
          },
          emitter: 'vite-preview/ActionsMenu',
        },
        options: {
          actions: buildNotificationActions(notification),
          duration: notification.duration,
          severity: notification.severity,
          tags: addNotificationTargetTag(notification.targetPanel),
        },
      });
    },
    [client],
  );

  const queueCurrentDraft = useCallback(() => {
    const duration = parseDuration(draft.duration);
    if (!isDraftReady(draft) || duration === null) return;

    chipIdRef.current += 1;
    setQueuedNotifications((current) => [
      ...current,
      {
        actionFeedback: draft.actionFeedback,
        actionLabel: draft.actionLabel,
        duration,
        entryDirection: draft.entryDirection as NotificationListEnterFrom,
        id: `queued-notification-${chipIdRef.current}`,
        message: draft.message.trim(),
        severity: draft.severity as NotificationSeverity,
        targetPanel: draft.targetPanel as NotificationTargetPanel,
      },
    ]);
    setDraft(initialDraft);
  }, [draft]);

  const registerQueuedNotifications = useCallback(() => {
    queuedNotifications.forEach(addNotification);
    closeDialog();
  }, [addNotification, closeDialog, queuedNotifications]);

  const removeQueuedNotification = useCallback((id: string) => {
    setQueuedNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const handleHeaderPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.closest('button')) return;

      const shell = shellRef.current;
      if (!shell) return;

      event.preventDefault();

      const startClientX = event.clientX;
      const startClientY = event.clientY;
      const startOffset = dragOffset;
      const startRect = shell.getBoundingClientRect();

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nextLeft = clamp(
          startRect.left + (moveEvent.clientX - startClientX),
          VIEWPORT_MARGIN,
          window.innerWidth - startRect.width - VIEWPORT_MARGIN,
        );
        const nextTop = clamp(
          startRect.top + (moveEvent.clientY - startClientY),
          VIEWPORT_MARGIN,
          window.innerHeight - startRect.height - VIEWPORT_MARGIN,
        );

        setDragOffset({
          x: startOffset.x + (nextLeft - startRect.left),
          y: startOffset.y + (nextTop - startRect.top),
        });
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [dragOffset],
  );

  const shellStyle = {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
  };

  return (
    <DialogAnchor
      allowFlip
      className='app__notification-dialog'
      dialogManagerId={dialogManager?.id}
      id={notificationPromptDialogId}
      placement='right-start'
      referenceElement={referenceElement}
      tabIndex={-1}
      trapFocus
      updatePositionOnContentResize
    >
      <div className='app__notification-dialog__shell' ref={shellRef} style={shellStyle}>
        <Prompt.Root className='app__notification-dialog__prompt'>
          <div
            className='app__notification-dialog__drag-handle'
            onPointerDown={handleHeaderPointerDown}
          >
            <Prompt.Header close={closeDialog} title='Trigger Notification' />
          </div>
          <NotificationDraftForm
            draft={draft}
            queueCurrentDraft={queueCurrentDraft}
            queuedNotifications={queuedNotifications}
            registerQueuedNotifications={registerQueuedNotifications}
            removeQueuedNotification={removeQueuedNotification}
            setDraft={setDraft}
          />
        </Prompt.Root>
      </div>
    </DialogAnchor>
  );
};
