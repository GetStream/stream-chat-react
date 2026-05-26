import React from 'react';
import { useCanCreatePoll } from '../../MessageComposer/hooks/useCanCreatePoll';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { useMessageComposerContext, useTranslationContext } from '../../../context';
import clsx from 'clsx';
import { IconSend } from '../../Icons';
import { Prompt } from '../../Dialog';
import { useNotificationApi } from '../../Notifications';

export type PollCreationDialogControlsProps = {
  close: () => void;
};

export const PollCreationDialogControls = ({
  close,
}: PollCreationDialogControlsProps) => {
  const { t } = useTranslationContext('PollCreationDialogControls');
  const { handleSubmit: handleSubmitMessage } = useMessageComposerContext();
  const messageComposer = useMessageComposerController();
  const canCreatePoll = useCanCreatePoll();
  const { addNotification } = useNotificationApi();

  return (
    <Prompt.Footer>
      <Prompt.FooterControls>
        <Prompt.FooterControlsButtonSecondary
          className={clsx('str-chat__prompt__footer__controls-button--cancel')}
          onClick={close}
          type='button'
        >
          {t('Cancel')}
        </Prompt.FooterControlsButtonSecondary>
        <Prompt.FooterControlsButtonPrimary
          className={clsx('str-chat__prompt__footer__controls-button--submit')}
          disabled={!canCreatePoll}
          onClick={async () => {
            // Close optimistically before the async work starts. This unmounts the
            // modal immediately, so focus returns to the trigger button (Open
            // Attachment Selector) without ever blipping through the Close button —
            // which previously caused screen readers to re-announce the dialog as
            // focus shifted away from Send Poll while createPoll() was in flight.
            close();
            try {
              await messageComposer.createPoll();
              await handleSubmitMessage();
              addNotification({
                emitter: 'PollCreationDialog',
                message: t('Poll sent'),
                severity: 'success',
                type: 'api:poll:create:success',
              });
            } catch {
              // createPoll() in stream-chat-js already publishes an
              // `api:poll:create:failed` notification (with the underlying error
              // `reason`) via client.notifications.addError, so we swallow the
              // rethrown error here only to avoid an unhandled rejection.
            }
          }}
          type='submit'
        >
          <IconSend />
          {t('Send poll')}
        </Prompt.FooterControlsButtonPrimary>
      </Prompt.FooterControls>
    </Prompt.Footer>
  );
};
