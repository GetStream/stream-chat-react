import { flushSync } from 'react-dom';
import {
  asDynamicKey,
  IconPoll,
  PollCreationDialogControls,
  type PollCreationDialogControlsProps,
  Prompt,
  useCanCreatePoll,
  useMessageComposerContext,
  useMessageComposerController,
  useTranslationContext,
} from 'stream-chat-react';

import { useAppSettingsSelector } from '../AppSettings';

/**
 * Creates the poll without sending it: the poll waits in the composer (`state.pollId`), shows in
 * its Poll preview, and goes out with the next message's text and attachments.
 */
const AttachPollControls = ({ close }: PollCreationDialogControlsProps) => {
  const { t } = useTranslationContext();
  const { textareaRef } = useMessageComposerContext();
  const messageComposer = useMessageComposerController();
  const canCreatePoll = useCanCreatePoll();

  return (
    <Prompt.Footer>
      <Prompt.FooterControls>
        <Prompt.FooterControlsButtonSecondary
          className='str-chat__prompt__footer__controls-button--cancel'
          onClick={close}
          type='button'
        >
          {t('common.cancel.label', 'Cancel')}
        </Prompt.FooterControlsButtonSecondary>
        <Prompt.FooterControlsButtonPrimary
          className='str-chat__prompt__footer__controls-button--submit'
          disabled={!canCreatePoll}
          onClick={async () => {
            // As in the default controls: close and focus the composer synchronously, so focus
            // does not blip through the attachment selector's trigger.
            flushSync(() => close());
            textareaRef?.current?.focus();
            try {
              await messageComposer.createPoll();
            } catch {
              // `createPoll()` already reported the failure as a notification.
            }
          }}
          type='submit'
        >
          <IconPoll />
          {t(
            asDynamicKey('viteExample.pollCreationDialog.attachPoll.text'),
            'Attach poll',
          )}
        </Prompt.FooterControlsButtonPrimary>
      </Prompt.FooterControls>
    </Prompt.Footer>
  );
};

/**
 * While the composer shows the Poll preview (Settings -> Composer), the dialog attaches the poll
 * to the message being composed instead of sending it on its own.
 */
export const ConfigurablePollCreationDialogControls = (
  props: PollCreationDialogControlsProps,
) => {
  const { disabledPreviewSections } = useAppSettingsSelector((state) => state.composer);

  return disabledPreviewSections.includes('poll') ? (
    <PollCreationDialogControls {...props} />
  ) : (
    <AttachPollControls {...props} />
  );
};
