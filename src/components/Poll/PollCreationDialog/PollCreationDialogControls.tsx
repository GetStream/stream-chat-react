import React from 'react';
import { flushSync } from 'react-dom';
import { useCanCreatePoll } from '../../MessageComposer/hooks/useCanCreatePoll';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { useMessageComposerContext, useTranslationContext } from '../../../context';
import clsx from 'clsx';
import { IconSend } from '../../Icons';
import { Prompt } from '../../Dialog';
import { useSendMessageFn } from '../../MessageComposer/hooks/useSendMessageFn';
import { useNotificationApi } from '../../Notifications';

export type PollCreationDialogControlsProps = {
  close: () => void;
};

export const PollCreationDialogControls = ({
  close,
}: PollCreationDialogControlsProps) => {
  const { t } = useTranslationContext('PollCreationDialogControls');
  const { textareaRef } = useMessageComposerContext();
  const messageComposer = useMessageComposerController();
  const sendMessage = useSendMessageFn();
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
          {t('common.cancel.label', 'Cancel')}
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
            } catch {
              // createPoll() in stream-chat-js already publishes an
              // `api:poll:create:failed` notification (with the underlying error
              // `reason`) via client.notifications.addError, so we swallow the
              // rethrown error here only to avoid an unhandled rejection. The poll
              // was not created, so do not attempt to send the message.
              return;
            }
            // The poll exists now; sending the message is a separate step that can fail on its own
            // (createPoll's self-notification only covers poll creation). `sendMessage()` never
            // rejects — it reports its own `api:message:send:failed` notification and resolves with
            // `false` — so the success announcement below must be gated on the returned flag.
            // Announcing "Poll sent" after a failed send would contradict the error notification.
            const sent = await sendMessage();
            if (!sent) return;
            addNotification({
              // Announce assertively: focus has just returned to the composer, so a polite
              // "Poll sent" would be queued behind the textarea's focus announcement and read
              // last (confusing). Assertive lets the confirmation be heard promptly.
              ariaLive: 'assertive',
              emitter: 'PollCreationDialog',
              message: t('poll.creationDialog.pollSent.text', 'Poll sent'),
              severity: 'success',
              type: 'api:poll:create:success',
            });
          }}
          type='submit'
        >
          <IconSend />
          {t('poll.creationDialog.sendPoll.text', 'Send Poll')}
        </Prompt.FooterControlsButtonPrimary>
      </Prompt.FooterControls>
    </Prompt.Footer>
  );
};
