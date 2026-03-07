import React from 'react';
import { Alert } from '../../Dialog';
import { useChatContext, usePollContext, useTranslationContext } from '../../../context';
import { Button } from '../../Button';

export type EndPollAlertProps = {
  close: () => void;
};

export const EndPollAlert = ({ close }: EndPollAlertProps) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { poll } = usePollContext();

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
              client.notifications.addSuccess({
                message: t('Poll ended'),
                options: {
                  type: 'api:poll:end:success',
                },
                origin: { emitter: 'EndPollAlert' },
              });
            } catch (e) {
              client.notifications.addError({
                message: t('Failed to end the poll'),
                options: {
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
