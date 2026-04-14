import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { DeleteMessageOptions, LocalMessage } from 'stream-chat';
import {
  Alert,
  Button,
  ContextMenuButton,
  defaultMessageActionSet,
  GlobalModal,
  IconDelete,
  IconNotification,
  MessageActions,
  SwitchField,
  type MessageActionSetItem,
  useComponentContext,
  useContextMenuContext,
  useMessageContext,
  useModalContext,
  useNotificationApi,
  useTranslationContext,
} from 'stream-chat-react';

import { useAppSettingsSelector } from '../AppSettings';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const getNotificationError = (error: unknown): Error | undefined => {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  if (error && typeof error === 'object' && 'message' in error) {
    const message = error.message;

    if (typeof message === 'string') return new Error(message);
  }
};

type CustomDeleteMessageAlertProps = {
  enableOptionConfiguration: boolean;
  onCancel: () => void;
  onDelete: (options: DeleteMessageOptions) => Promise<void>;
};

const CustomDeleteMessageAlert = ({
  enableOptionConfiguration,
  onCancel,
  onDelete,
}: CustomDeleteMessageAlertProps) => {
  const { t } = useTranslationContext();
  const { close } = useModalContext();
  const [deleteForMe, setDeleteForMe] = useState(false);
  const [hardDelete, setHardDelete] = useState(false);
  const [softDelete, setSoftDelete] = useState(true);

  return (
    <Alert.Root
      className='str-chat__delete-message-alert'
      data-testid='message-delete-alert'
    >
      <Alert.Header
        description={t('Are you sure you want to delete this message?')}
        title={t('Delete message')}
      />
      {enableOptionConfiguration && (
        <div className='app__custom-delete-message-alert__options'>
          <SwitchField
            checked={deleteForMe}
            id='delete-message-alert-delete-only-for-me-switch'
            onChange={(event) => setDeleteForMe(event.target.checked)}
          >
            {t('Delete for me only')}
          </SwitchField>
          <SwitchField
            checked={hardDelete}
            id='delete-message-alert-hard-delete-switch'
            onChange={(event) => {
              const checked = event.target.checked;

              setHardDelete(checked);
              if (checked) setSoftDelete(false);
              if (!checked && !softDelete) setSoftDelete(true);
            }}
          >
            {t('Hard delete')}
          </SwitchField>
          <SwitchField
            checked={softDelete}
            id='delete-message-alert-soft-delete-switch'
            onChange={(event) => {
              const checked = event.target.checked;

              setSoftDelete(checked);
              if (checked) setHardDelete(false);
              if (!checked && !hardDelete) setHardDelete(true);
            }}
          >
            {t('Soft delete')}
          </SwitchField>
        </div>
      )}
      <Alert.Actions>
        <Button
          appearance='outline'
          className='str-chat__delete-message-alert__delete-button'
          data-testid='delete-message-alert-delete-button'
          onClick={() => onDelete({ deleteForMe, hardDelete })}
          size='md'
          variant='danger'
        >
          {t('Delete message')}
        </Button>
        <Button
          appearance='outline'
          className='str-chat__delete-message-alert__cancel-button'
          data-testid='delete-message-alert-cancel-button'
          onClick={() => {
            onCancel();
            close();
          }}
          size='md'
          variant='secondary'
        >
          {t('Cancel')}
        </Button>
      </Alert.Actions>
    </Alert.Root>
  );
};

type OpenDeleteDialogParams = {
  handleDelete: (options?: DeleteMessageOptions) => Promise<void> | void;
  message: LocalMessage;
};

type CustomDeleteActionContextValue = {
  openDeleteDialog: (params: OpenDeleteDialogParams) => void;
};

const CustomDeleteActionContext = createContext<
  CustomDeleteActionContextValue | undefined
>(undefined);

const useCustomDeleteActionContext = () => {
  const contextValue = useContext(CustomDeleteActionContext);

  if (!contextValue) {
    throw new Error(
      'useCustomDeleteActionContext must be used within CustomDeleteActionContext.Provider',
    );
  }

  return contextValue;
};

const CustomDeleteMessageAction = () => {
  const { closeMenu } = useContextMenuContext();
  const { openDeleteDialog } = useCustomDeleteActionContext();
  const { handleDelete, message } = useMessageContext();
  const { t } = useTranslationContext();

  return (
    <ContextMenuButton
      aria-label={t('aria/Delete Message')}
      className='str-chat__message-actions-list-item-button'
      Icon={IconDelete}
      onClick={() => {
        openDeleteDialog({ handleDelete, message });
        closeMenu();
      }}
      variant='destructive'
    >
      {t('Delete message')}
    </ContextMenuButton>
  );
};

const CustomMarkOwnUnreadMessageAction = () => {
  const { closeMenu } = useContextMenuContext();
  const { handleMarkUnread, isMyMessage, message } = useMessageContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();

  if (!isMyMessage()) return null;

  return (
    <ContextMenuButton
      aria-label={t('aria/Mark Message Unread')}
      className='str-chat__message-actions-list-item-button'
      Icon={IconNotification}
      onClick={async (event) => {
        try {
          await handleMarkUnread(event);
          addNotification({
            context: {
              message,
            },
            emitter: 'MessageActions',
            message: t('Message marked as unread'),
            severity: 'success',
            type: 'api:message:markUnread:success',
          });
        } catch (error) {
          addNotification({
            context: {
              message,
            },
            emitter: 'MessageActions',
            error: getNotificationError(error),
            message: getErrorMessage(
              error,
              t(
                'Error marking message unread. Cannot mark unread messages older than the newest 100 channel messages.',
              ),
            ),
            severity: 'error',
            type: 'api:message:markUnread:failed',
          });
        } finally {
          closeMenu();
        }
      }}
    >
      {t('Mark as unread')}
    </ContextMenuButton>
  );
};

type SupportedCustomMessageActionType = 'delete' | 'markOwnUnread';

type CustomMessageActionOverrideSpec = {
  actionSetItem: MessageActionSetItem;
  insertBeforeType?: string;
  enabled: boolean;
  mode: 'append' | 'replace';
};

const applyCustomMessageActionOverrides = ({
  messageActionSet,
  overrides,
}: {
  messageActionSet: MessageActionSetItem[];
  overrides: CustomMessageActionOverrideSpec[];
}) =>
  overrides.reduce((acc, { actionSetItem, enabled, insertBeforeType, mode }) => {
    if (!enabled || actionSetItem.placement === 'quick-dropdown-toggle') return acc;
    const actionType = actionSetItem.type;
    if (mode === 'append') {
      if (!insertBeforeType) return [...acc, actionSetItem];

      const insertBeforeIndex = acc.findIndex(
        (messageActionSetItem) =>
          'type' in messageActionSetItem &&
          messageActionSetItem.type === insertBeforeType,
      );

      if (insertBeforeIndex < 0) return [...acc, actionSetItem];

      return [
        ...acc.slice(0, insertBeforeIndex),
        actionSetItem,
        ...acc.slice(insertBeforeIndex),
      ];
    }

    return [
      ...acc.filter(
        (messageActionSetItem) =>
          !('type' in messageActionSetItem) || messageActionSetItem.type !== actionType,
      ),
      actionSetItem,
    ];
  }, messageActionSet);

export const ConfigurableMessageActions = (
  props: React.ComponentProps<typeof MessageActions>,
) => {
  const { addNotification } = useNotificationApi();
  const { Modal = GlobalModal } = useComponentContext();
  const [deleteDialogTarget, setDeleteDialogTarget] =
    useState<OpenDeleteDialogParams | null>(null);
  const { t } = useTranslationContext();
  const { customMessageActions } = useAppSettingsSelector(
    (state) => state.messageActions,
  );
  const configurableActionSet = useMemo(() => {
    const actionSet = props.messageActionSet ?? defaultMessageActionSet;
    const actionOverrides: Record<
      SupportedCustomMessageActionType,
      Omit<CustomMessageActionOverrideSpec, 'enabled'>
    > = {
      delete: {
        actionSetItem: {
          Component: CustomDeleteMessageAction,
          placement: 'dropdown',
          type: 'delete',
        },
        mode: 'replace',
      },
      markOwnUnread: {
        actionSetItem: {
          Component: CustomMarkOwnUnreadMessageAction,
          placement: 'dropdown',
          type: 'markOwnUnread',
        },
        insertBeforeType: 'remindMe',
        mode: 'append',
      },
    };

    const overrides: CustomMessageActionOverrideSpec[] = [
      {
        ...actionOverrides.delete,
        enabled: true,
      },
      {
        ...actionOverrides.markOwnUnread,
        enabled: customMessageActions.markOwnUnread,
      },
    ];

    return applyCustomMessageActionOverrides({ messageActionSet: actionSet, overrides });
  }, [customMessageActions, props.messageActionSet]);
  const openDeleteDialog = useCallback((params: OpenDeleteDialogParams) => {
    setDeleteDialogTarget(params);
  }, []);

  return (
    <CustomDeleteActionContext.Provider value={{ openDeleteDialog }}>
      <MessageActions {...props} messageActionSet={configurableActionSet} />
      <Modal
        open={Boolean(deleteDialogTarget)}
        onClose={() => {
          setDeleteDialogTarget(null);
        }}
      >
        {deleteDialogTarget && (
          <CustomDeleteMessageAlert
            enableOptionConfiguration={
              customMessageActions.delete.enableOptionConfiguration
            }
            onCancel={() => {
              setDeleteDialogTarget(null);
            }}
            onDelete={async (options) => {
              try {
                await deleteDialogTarget.handleDelete(options);
                addNotification({
                  context: {
                    message: deleteDialogTarget.message,
                  },
                  emitter: 'MessageActions',
                  message: t('Message deleted'),
                  severity: 'success',
                  type: 'api:message:delete:success',
                });
              } catch (error) {
                addNotification({
                  context: {
                    message: deleteDialogTarget.message,
                  },
                  emitter: 'MessageActions',
                  error: getNotificationError(error),
                  message: getErrorMessage(error, t('Error deleting message')),
                  severity: 'error',
                  type: 'api:message:delete:failed',
                });
              } finally {
                setDeleteDialogTarget(null);
              }
            }}
          />
        )}
      </Modal>
    </CustomDeleteActionContext.Provider>
  );
};
