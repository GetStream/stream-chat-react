import React from 'react';
import { flushSync } from 'react-dom';
import { useCanCreatePoll } from '../../MessageComposer/hooks/useCanCreatePoll';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import {
  useComponentContextIcons,
  useMessageComposerContext,
  useTranslationContext,
} from '../../../context';
import clsx from 'clsx';
import { Prompt } from '../../Dialog';
import { useNotificationApi } from '../../Notifications';

export type PollCreationDialogControlsProps = {
  close: () => void;
};

export const PollCreationDialogControls = ({
  close,
}: PollCreationDialogControlsProps) => {
  const { IconSend } = useComponentContextIcons();
  const { t } = useTranslationContext();
  const { textareaRef } = useMessageComposerContext();
  const messageComposer = useMessageComposerController();
  const sendMessage = messageComposer.send;
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
            // Close and focus the composer in the same synchronous turn, before the async work.
            // The focus restorers (react-aria's FocusScope, AttachmentSelector's trigger) act only
            // when focus fell to <body>, so this avoids a focus blip through the attachment
            // trigger.
            flushSync(() => close());
            textareaRef?.current?.focus();
            try {
              await messageComposer.createPoll();
            } catch {
              // `createPoll()` already emits an `api:poll:create:failed` notification; the rethrown
              // error is swallowed to avoid an unhandled rejection. No poll exists, so do not send.
              return;
            }
            // `createPoll()` also returns without a poll when the composition is empty. Sending
            // then would submit whatever else the composer holds (drafted text) without the poll.
            if (!messageComposer.pollId) return;
            // `sendMessage()` never rejects and reports its own failure, so the success
            // notification is gated on the result. Compared to `'sent'` because `'failed'` and
            // `'nothing-to-send'` are truthy strings.
            if ((await sendMessage()) !== 'sent') return;
            addNotification({
              // Assertive: focus just returned to the composer, and a polite message would be
              // read after that focus announcement.
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
