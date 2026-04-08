import React from 'react';
import { Alert } from '../../Dialog';
import { useModalContext, usePollContext, useTranslationContext } from '../../../context';
import { Button } from '../../Button';
import { useNotificationApi } from '../../Notifications';

export const EndPollAlert = () => {
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const { poll } = usePollContext();
  const { close } = useModalContext();

  return (
    <Alert.Root className={'str-chat__end-poll-alert'}>
      <Alert.Header
        description={t(
          'Do you want to end this poll now? Nobody will be able to vote in this poll anymore.',
        )}
        title={t('End this poll?')}
      ></Alert.Header>
      <Alert.Actions>
        <Button
          appearance='outline'
          className='str-chat__end-poll-alert__end-vote-button'
          data-testid='end-poll-alert-end-vote-button'
          onClick={async () => {
            try {
              await poll.close();
              close();
              addNotification({
                emitter: 'EndPollAlert',
                message: t('Poll ended'),
                severity: 'success',
                type: 'api:poll:end:success',
              });
            } catch (e) {
              addNotification({
                emitter: 'EndPollAlert',
                error: e instanceof Error ? e : undefined,
                message: t('Failed to end the poll'),
                severity: 'error',
                type: 'api:poll:end:failed',
              });
            }
          }}
          size='md'
          variant='danger'
        >
          {t('End poll')}
        </Button>
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
      </Alert.Actions>
    </Alert.Root>
  );
};
