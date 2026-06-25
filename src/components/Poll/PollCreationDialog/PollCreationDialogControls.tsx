import React from 'react';
import { flushSync } from 'react-dom';
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
  const { handleSubmit: handleSubmitMessage, textareaRef } = useMessageComposerContext();
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
            // Close optimistically and move focus to the composer in the SAME synchronous turn,
            // BEFORE the async work starts. `flushSync` unmounts the modal now; we then focus the
            // textarea immediately, so it is the active element before any focus-restore runs.
            // Both restorers (react-aria's FocusScope and AttachmentSelector's trigger restore)
            // only act if focus fell to <body>, so moving it to the composer first suppresses
            // them — avoiding a focus blip through the attachment "+" trigger (a screen reader
            // would otherwise announce that extra jump before landing in the composer). Closing
            // first also avoids the Send→Close button blip while createPoll() is in flight.
            flushSync(() => close());
            textareaRef?.current?.focus();
            try {
              await messageComposer.createPoll();
              await handleSubmitMessage();
              addNotification({
                // Announce assertively: focus has just returned to the composer, so a polite
                // "Poll sent" would be queued behind the textarea's focus announcement and read
                // last (confusing). Assertive lets the confirmation be heard promptly.
                ariaLive: 'assertive',
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
