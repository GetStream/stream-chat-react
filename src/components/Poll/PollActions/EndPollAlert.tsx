import React from 'react';
import { Alert } from '../../Dialog';
import {
  useChatContext,
  useModalContext,
  usePollContext,
  useTranslationContext,
} from '../../../context';
import { Button } from '../../Button';
import { addNotificationTargetTag, useNotificationTarget } from '../../Notifications';

export const EndPollAlert = () => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { poll } = usePollContext();
  const { close } = useModalContext();
  const panel = useNotificationTarget();

  return (
    <Alert.Root className={'str-chat__end-poll-alert'}>
      <Alert.Header
        description={t(
          'Do you want to end this poll now? Nobody will be able to vote in this poll anymore.',
        )}
        title={t('End this poll?')}
      ></Alert.Header>
      <Alert.Actions className='str-chat__end-poll-alert__actions'>
        <Button
          appearance='outline'
          className='str-chat__end-poll-alert__cancel-button'
          data-testid='end-poll-alert-cancel-button'
          onClick={close}
          size='md'
          variant='secondary'
        >
          {t('Cancel')}
        </Button>
        <Button
          appearance='outline'
          className='str-chat__end-poll-alert__end-vote-button'
          data-testid='end-poll-alert-end-vote-button'
          onClick={async () => {
            try {
              await poll.close();
              close();
              client.notifications.addSuccess({
                message: t('Poll ended'),
                options: {
                  tags: addNotificationTargetTag(panel),
                  type: 'api:poll:end:success',
                },
                origin: { emitter: 'EndPollAlert' },
              });
            } catch (e) {
              client.notifications.addError({
                message: t('Failed to end the poll'),
                options: {
                  originalError: e instanceof Error ? e : undefined,
                  tags: addNotificationTargetTag(panel),
                  type: 'api:poll:end:failed',
                },
                origin: { emitter: 'EndPollAlert' },
              });
            }
          }}
          size='md'
          variant='danger'
        >
          {t('End poll')}
        </Button>
      </Alert.Actions>
    </Alert.Root>
  );
};
