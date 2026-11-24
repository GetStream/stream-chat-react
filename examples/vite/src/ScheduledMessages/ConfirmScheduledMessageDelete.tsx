import {
  Alert,
  asDynamicKey,
  Button,
  type ScheduledMessageDeleteAlertProps,
  useTranslationContext,
} from 'stream-chat-react';

/** The Figma delete confirmation for a scheduled message, registered as `ScheduledMessageDeleteAlert`. */
export const ConfirmScheduledMessageDelete = ({
  channelName,
  onCancel,
  onDelete,
}: ScheduledMessageDeleteAlertProps) => {
  const { t } = useTranslationContext();

  const description = channelName
    ? t(
        asDynamicKey('viteExample.scheduledMessages.deleteAlert.descriptionWithName'),
        "This message to {{ name }} won't be sent. This can't be undone.",
        { name: channelName },
      )
    : t(
        asDynamicKey('viteExample.scheduledMessages.deleteAlert.description'),
        "This message won't be sent. This can't be undone.",
      );

  return (
    <Alert.Root
      className='app__schedule-delete-alert'
      data-testid='delete-scheduled-message-alert'
    >
      <Alert.Header
        description={description}
        title={t(
          asDynamicKey('viteExample.scheduledMessages.deleteAlert.title'),
          'Delete scheduled message?',
        )}
      />
      <Alert.Actions>
        <Button appearance='solid' onClick={onDelete} size='md' variant='danger'>
          {t(asDynamicKey('viteExample.scheduledMessages.deleteAlert.delete'), 'Delete')}
        </Button>
        <Button
          appearance='outline'
          autoFocus
          onClick={onCancel}
          size='md'
          variant='secondary'
        >
          {t(asDynamicKey('viteExample.scheduledMessages.deleteAlert.cancel'), 'Cancel')}
        </Button>
      </Alert.Actions>
    </Alert.Root>
  );
};
