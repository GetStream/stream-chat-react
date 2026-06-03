import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { NotificationSeverity } from 'stream-chat';
import {
  Button,
  GlobalModal,
  IconArrowDown,
  IconArrowLeft,
  IconArrowUp,
  IconCheckmark,
  IconChevronRight,
  IconClock,
  IconExclamationMark,
  IconExclamationTriangleFill,
  IconMinus,
  IconPlusSmall,
  IconRefresh,
  IconXmark,
  type NotificationListEnterFrom,
  type NotificationTargetPanel,
  NumericInput,
  PopperTooltip,
  Prompt,
  TextInput,
  useDialogIsOpen,
  useDialogOnNearestManager,
  useNotificationApi,
  Viewer,
} from 'stream-chat-react';
import { DraggableDialog } from './DraggableDialog';
import {
  buildNotificationActions,
  entryDirectionOptions,
  initialDraft,
  isDraftReady,
  type NotificationDraft,
  type NotificationDraftAction,
  parseDuration,
  type QueuedNotification,
  severityOptions,
  targetPanelOptions,
} from './triggerNotificationUtils';

export const notificationPromptDialogId = 'app-notification-prompt-dialog';

const severityIcons: Partial<
  Record<NotificationSeverity, React.ComponentType<{ className?: string }>>
> = {
  error: IconExclamationMark,
  info: IconExclamationMark,
  loading: IconRefresh,
  success: IconCheckmark,
  warning: IconExclamationTriangleFill,
};

const directionIcons: Record<
  NotificationListEnterFrom,
  React.ComponentType<{ className?: string }>
> = {
  bottom: IconArrowUp,
  left: IconChevronRight,
  right: IconArrowLeft,
  top: IconArrowDown,
};

const formatDurationLabel = (duration: number) => {
  if (duration === 0) return 'manual';
  if (duration < 1000) return `${duration}ms`;
  if (duration % 1000 === 0) return `${duration / 1000}s`;
  return `${(duration / 1000).toFixed(1)}s`;
};

const formatActionsLabel = (count: number) => `${count} action${count === 1 ? '' : 's'}`;

const isDraftActionReady = (
  action: Pick<NotificationDraftAction, 'feedback' | 'label'>,
) => action.label.trim().length > 0 && action.feedback.trim().length > 0;

const NotificationEntrySelect = ({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  value: string;
}) => (
  <label className='app__notification-dialog__field'>
    <span className='app__notification-dialog__field-label'>{label}</span>
    <select
      className='app__notification-dialog__select'
      disabled={disabled}
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

const NotificationTargetPanelSelect = ({
  onChange,
  options,
  value,
}: {
  onChange: (value: NotificationTargetPanel[]) => void;
  options: readonly NotificationTargetPanel[];
  value: NotificationTargetPanel[];
}) => (
  <div className='app__notification-dialog__field'>
    <span className='app__notification-dialog__field-label'>Target Panels</span>
    <div className='app__notification-dialog__target-panel-options'>
      {options.map((option) => (
        <label className='app__notification-dialog__target-panel-option' key={option}>
          <input
            checked={value.includes(option)}
            onChange={(event) => {
              if (event.target.checked) {
                onChange([...value, option]);
                return;
              }

              onChange(value.filter((panel) => panel !== option));
            }}
            type='checkbox'
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  </div>
);

const NotificationChipList = ({
  notifications,
  publishQueuedNotification,
  removeQueuedNotification,
}: {
  notifications: QueuedNotification[];
  publishQueuedNotification: (notification: QueuedNotification) => void;
  removeQueuedNotification: (id: string) => void;
}) => {
  const [tooltipState, setTooltipState] = useState<{
    referenceElement: HTMLDivElement;
    text: string;
  } | null>(null);

  return (
    <div className='app__notification-dialog__chips' role='list'>
      {notifications.map((notification) => {
        const SeverityIcon = severityIcons[notification.severity];
        const DirectionIcon = directionIcons[notification.entryDirection];

        return (
          <div
            className='app__notification-dialog__chip'
            key={notification.id}
            onBlurCapture={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
                return;
              }
              setTooltipState(null);
            }}
            onFocusCapture={(event) =>
              setTooltipState({
                referenceElement: event.currentTarget,
                text: notification.message,
              })
            }
            onMouseEnter={(event) =>
              setTooltipState({
                referenceElement: event.currentTarget,
                text: notification.message,
              })
            }
            onMouseLeave={() => setTooltipState(null)}
            role='listitem'
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
                {notification.targetPanels.join(', ')}
              </span>
              {notification.actions.length > 0 && (
                <span className='app__notification-dialog__chip-panel'>
                  {formatActionsLabel(notification.actions.length)}
                </span>
              )}
            </span>
            <Button
              appearance='outline'
              className='app__notification-dialog__chip-trigger'
              onClick={() => publishQueuedNotification(notification)}
              size='xs'
              type='button'
              variant='secondary'
            >
              Trigger
            </Button>
            <Button
              appearance='ghost'
              aria-label={`Remove ${notification.message}`}
              circular
              className='app__notification-dialog__chip-remove'
              onClick={() => removeQueuedNotification(notification.id)}
              size='xs'
              variant='secondary'
            >
              <IconXmark />
            </Button>
          </div>
        );
      })}
      <PopperTooltip
        referenceElement={tooltipState?.referenceElement ?? null}
        visible={!!tooltipState}
      >
        {tooltipState?.text ?? ''}
      </PopperTooltip>
    </div>
  );
};

const NotificationDraftForm = ({
  addDraftAction,
  closeOnSubmit,
  draft,
  openGlobalModal,
  publishQueuedNotification,
  queueCurrentDraft,
  queuedNotifications,
  registerQueuedNotifications,
  setCloseOnSubmit,
  toggleDraftActionInPayload,
  removeQueuedNotification,
  setDraft,
  updateDraftAction,
}: {
  addDraftAction: () => void;
  closeOnSubmit: boolean;
  draft: NotificationDraft;
  openGlobalModal: () => void;
  publishQueuedNotification: (notification: QueuedNotification) => void;
  queueCurrentDraft: () => void;
  queuedNotifications: QueuedNotification[];
  registerQueuedNotifications: () => void;
  setCloseOnSubmit: Dispatch<SetStateAction<boolean>>;
  toggleDraftActionInPayload: (id: string) => void;
  removeQueuedNotification: (id: string) => void;
  setDraft: Dispatch<SetStateAction<NotificationDraft>>;
  updateDraftAction: <Key extends keyof NotificationDraftAction>(
    actionId: string,
    key: Key,
    value: NotificationDraftAction[Key],
  ) => void;
}) => {
  const canQueueCurrentDraft = isDraftReady(draft);
  const canAddDraftAction = draft.actions.every((action) => action.includedInPayload);

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
            <div className='app__notification-dialog__field'>
              <span className='app__notification-dialog__field-label'>Duration (ms)</span>
              <div className='app__notification-dialog__duration-controls'>
                <NumericInput
                  aria-label='Duration (ms)'
                  min={0}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, duration: event.target.value }))
                  }
                  value={draft.duration}
                />
                <Button
                  appearance='outline'
                  className='app__notification-dialog__permanent-duration-button'
                  onClick={() => setDraft((current) => ({ ...current, duration: '0' }))}
                  size='sm'
                  type='button'
                  variant='secondary'
                >
                  Make permanent
                </Button>

                <Button
                  appearance='outline'
                  className='app__notification-dialog__open-modal-button'
                  onClick={openGlobalModal}
                  size='sm'
                  type='button'
                  variant='secondary'
                >
                  Open preview modal
                </Button>
              </div>
            </div>
            <NotificationTargetPanelSelect
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  targetPanels: value,
                }))
              }
              options={targetPanelOptions}
              value={draft.targetPanels}
            />
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
            <div className='app__notification-dialog__actions'>
              <div className='app__notification-dialog__actions-header'>
                <span className='app__notification-dialog__field-label'>
                  Action(s) (optional)
                </span>
              </div>
              <div className='app__notification-dialog__actions-list'>
                {draft.actions.map((action, index) => {
                  const canAddActionToPayload = isDraftActionReady(action);

                  return (
                    <div className='app__notification-dialog__action-row' key={action.id}>
                      <TextInput
                        className='app__notification-dialog__text-input'
                        label={`Action ${index + 1} Label`}
                        onChange={(event) =>
                          updateDraftAction(action.id, 'label', event.target.value)
                        }
                        placeholder='Optional button label'
                        value={action.label}
                      />
                      <TextInput
                        className='app__notification-dialog__text-input'
                        label={`Action ${index + 1} Follow-up Message`}
                        onChange={(event) =>
                          updateDraftAction(action.id, 'feedback', event.target.value)
                        }
                        placeholder='Optional alert triggered by the action button'
                        value={action.feedback}
                      />
                      <Button
                        aria-label={
                          action.includedInPayload
                            ? 'Remove action from payload'
                            : 'Add action to payload'
                        }
                        appearance='outline'
                        circular
                        className='app__notification-dialog__action-toggle'
                        disabled={!action.includedInPayload && !canAddActionToPayload}
                        onClick={() => toggleDraftActionInPayload(action.id)}
                        size='xs'
                        variant='secondary'
                      >
                        {action.includedInPayload ? <IconMinus /> : <IconPlusSmall />}
                      </Button>
                    </div>
                  );
                })}
              </div>
              <Button
                appearance='ghost'
                className='app__notification-dialog__action-add'
                disabled={!canAddDraftAction}
                onClick={addDraftAction}
                size='sm'
                variant='secondary'
              >
                <IconPlusSmall />
                Add action
              </Button>
            </div>
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
            publishQueuedNotification={publishQueuedNotification}
            removeQueuedNotification={removeQueuedNotification}
          />
        </div>
        <Prompt.FooterControls className='app__notification-dialog__footer-controls'>
          <label className='app__notification-dialog__close-on-submit'>
            <input
              checked={closeOnSubmit}
              onChange={(event) => setCloseOnSubmit(event.target.checked)}
              type='checkbox'
            />
            <span>Close on submit</span>
          </label>
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
  const actionIdRef = useRef(0);
  const createDraftAction = useCallback((): NotificationDraftAction => {
    actionIdRef.current += 1;

    return {
      feedback: '',
      id: `draft-notification-action-${actionIdRef.current}`,
      includedInPayload: false,
      label: '',
    };
  }, []);
  const createInitialDraftState = useCallback(
    (): NotificationDraft => ({
      ...initialDraft,
      actions: [createDraftAction()],
    }),
    [createDraftAction],
  );
  const [draft, setDraft] = useState<NotificationDraft>(() => createInitialDraftState());
  const [queuedNotifications, setQueuedNotifications] = useState<QueuedNotification[]>(
    [],
  );
  const [closeOnSubmit, setCloseOnSubmit] = useState(false);
  const [globalModalOpen, setGlobalModalOpen] = useState(false);
  const chipIdRef = useRef(0);
  const { addNotification } = useNotificationApi();
  const { dialog, dialogManager } = useDialogOnNearestManager({
    id: notificationPromptDialogId,
  });
  const dialogIsOpen = useDialogIsOpen(notificationPromptDialogId, dialogManager?.id);

  const resetState = useCallback(() => {
    setDraft(createInitialDraftState());
    setQueuedNotifications([]);
    setCloseOnSubmit(false);
  }, [createInitialDraftState]);

  useEffect(() => {
    if (dialogIsOpen) return;
    resetState();
  }, [dialogIsOpen, resetState]);

  const closeDialog = useCallback(() => {
    dialog.close();
  }, [dialog]);

  const publishNotification = useCallback(
    (notification: QueuedNotification) => {
      addNotification({
        actions: buildNotificationActions(notification),
        context: {
          entryDirection: notification.entryDirection,
          ...(notification.targetPanels.length === 1
            ? { panel: notification.targetPanels[0] }
            : { targetPanels: notification.targetPanels }),
        },
        duration: notification.duration,
        emitter: 'vite-preview/ActionsMenu',
        message: notification.message,
        severity: notification.severity,
        targetPanels: notification.targetPanels,
      });
    },
    [addNotification],
  );

  const queueCurrentDraft = useCallback(() => {
    const duration = parseDuration(draft.duration);
    if (!isDraftReady(draft) || duration === null) return;

    chipIdRef.current += 1;
    setQueuedNotifications((current) => [
      ...current,
      {
        actions: draft.actions
          .map((action) => ({
            includedInPayload: action.includedInPayload,
            feedback: action.feedback.trim(),
            label: action.label.trim(),
          }))
          .filter((action) => action.includedInPayload && action.label && action.feedback)
          .map(({ feedback, label }) => ({ feedback, label })),
        duration,
        entryDirection: draft.entryDirection as NotificationListEnterFrom,
        id: `queued-notification-${chipIdRef.current}`,
        message: draft.message.trim(),
        severity: draft.severity as NotificationSeverity,
        targetPanels: draft.targetPanels,
      },
    ]);
    setDraft(createInitialDraftState());
  }, [createInitialDraftState, draft]);

  const registerQueuedNotifications = useCallback(() => {
    queuedNotifications.forEach(publishNotification);
    setQueuedNotifications([]);

    if (closeOnSubmit) {
      closeDialog();
    }
  }, [closeDialog, closeOnSubmit, publishNotification, queuedNotifications]);

  const removeQueuedNotification = useCallback((id: string) => {
    setQueuedNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const publishQueuedNotification = useCallback(
    (notification: QueuedNotification) => {
      publishNotification(notification);
      removeQueuedNotification(notification.id);
    },
    [publishNotification, removeQueuedNotification],
  );

  const addDraftAction = useCallback(() => {
    setDraft((current) => ({
      ...current,
      actions: [...current.actions, createDraftAction()],
    }));
  }, [createDraftAction]);

  const toggleDraftActionInPayload = useCallback((id: string) => {
    setDraft((current) => ({
      ...current,
      actions: current.actions.map((action) =>
        action.id === id
          ? { ...action, includedInPayload: !action.includedInPayload }
          : action,
      ),
    }));
  }, []);

  const updateDraftAction = useCallback(
    <Key extends keyof NotificationDraftAction>(
      actionId: string,
      key: Key,
      value: NotificationDraftAction[Key],
    ) => {
      setDraft((current) => ({
        ...current,
        actions: current.actions.map((action) =>
          action.id === actionId
            ? {
                ...action,
                [key]: value,
                includedInPayload:
                  key === 'feedback' || key === 'label'
                    ? isDraftActionReady({
                        ...action,
                        [key]: value,
                      })
                      ? action.includedInPayload
                      : false
                    : action.includedInPayload,
              }
            : action,
        ),
      }));
    },
    [],
  );

  return (
    <>
      <GlobalModal onClose={() => setGlobalModalOpen(false)} open={globalModalOpen}>
        <Viewer.Root className='app__notification-dialog__global-modal-preview'>
          <h2>GlobalModal notification preview</h2>
          <p>
            Keep the trigger dialog open and submit notifications while this modal is
            visible.
          </p>
          <Button onClick={() => setGlobalModalOpen(false)} type='button'>
            Close preview modal
          </Button>
        </Viewer.Root>
      </GlobalModal>
      <DraggableDialog
        dialogClassName='app__notification-dialog'
        dialogId={notificationPromptDialogId}
        dialogIsOpen={dialogIsOpen}
        dialogManagerId={dialogManager?.id}
        dragHandleClassName='app__notification-dialog__drag-handle'
        onClose={closeDialog}
        promptClassName='app__notification-dialog__prompt'
        referenceElement={referenceElement}
        shellClassName='app__notification-dialog__shell'
        title='Trigger Notification'
      >
        <NotificationDraftForm
          addDraftAction={addDraftAction}
          closeOnSubmit={closeOnSubmit}
          draft={draft}
          openGlobalModal={() => setGlobalModalOpen(true)}
          publishQueuedNotification={publishQueuedNotification}
          queueCurrentDraft={queueCurrentDraft}
          queuedNotifications={queuedNotifications}
          registerQueuedNotifications={registerQueuedNotifications}
          removeQueuedNotification={removeQueuedNotification}
          setCloseOnSubmit={setCloseOnSubmit}
          setDraft={setDraft}
          toggleDraftActionInPayload={toggleDraftActionInPayload}
          updateDraftAction={updateDraftAction}
        />
      </DraggableDialog>
    </>
  );
};
