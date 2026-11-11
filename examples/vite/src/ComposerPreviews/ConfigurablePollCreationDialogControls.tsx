import { useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { dateToNs, type LocalMessage, toScheduledMessagePreview } from 'stream-chat';
import {
  asDynamicKey,
  GlobalModal,
  IconClock,
  IconPoll,
  PollCreationDialogControls,
  type PollCreationDialogControlsProps,
  Prompt,
  ScheduleTimeDialog,
  useCanCreatePoll,
  useCanScheduleMessage,
  useChatContext,
  useMessageComposerContext,
  useMessageComposerController,
  useTranslationContext,
} from 'stream-chat-react';

import { useAppSettingsSelector } from '../AppSettings';

/** The message being composed with the poll the dialog is creating, to preview in the time dialog. */
const usePollMessagePreview = (): LocalMessage => {
  const { client } = useChatContext();
  const messageComposer = useMessageComposerController();
  const { name } = messageComposer.pollComposer.state.getLatestValue().data;
  const { text } = messageComposer.textComposer;
  const { attachments } = messageComposer.attachmentManager;
  return useMemo(() => {
    const now = dateToNs(new Date());
    const preview = toScheduledMessagePreview({
      cid: messageComposer.channel.cid,
      created_at: now,
      id: messageComposer.id,
      message: { attachments, custom: {}, text },
      scheduled_at: now,
      status: 'scheduled',
      updated_at: now,
      user: { id: client.userID ?? '', ...client.user } as never,
    });
    return { ...preview, poll: { name } as LocalMessage['poll'] };
  }, [attachments, client, messageComposer, name, text]);
};

/**
 * Creates the poll without sending it: the poll waits in the composer (`state.pollId`), shows in
 * its Poll preview, and goes out with the next message's text and attachments. Schedule does the
 * same and schedules that message right away; its time is picked first and only then is the poll
 * created, so cancelling the time dialog leaves nothing behind.
 */
const AttachPollControls = ({ close }: PollCreationDialogControlsProps) => {
  const { t } = useTranslationContext();
  const { textareaRef } = useMessageComposerContext();
  const messageComposer = useMessageComposerController();
  const canCreatePoll = useCanCreatePoll();
  const canSchedule = useCanScheduleMessage();
  const [isPickingTime, setIsPickingTime] = useState(false);
  const previewMessage = usePollMessagePreview();

  // As in the default controls: close and focus the composer synchronously, so focus does not
  // blip through the attachment selector's trigger.
  const closeAndFocusComposer = () => {
    flushSync(() => close());
    textareaRef?.current?.focus();
  };

  // rejects to keep the time dialog open, which then says the scheduling failed
  const schedulePoll = async (scheduledAt: Date) => {
    // a poll made by an earlier, failed attempt is reused
    if (!messageComposer.pollId) await messageComposer.createPoll();
    if (!messageComposer.pollId) throw new Error('The poll was not created');
    const { error, status } = await messageComposer.schedule(scheduledAt);
    if (status !== 'scheduled' && status !== 'sent') {
      throw error ?? new Error(`The poll was not scheduled: ${status}`);
    }
    setIsPickingTime(false);
    closeAndFocusComposer();
  };

  return (
    <>
      <Prompt.Footer>
        <Prompt.FooterControls>
          <Prompt.FooterControlsButtonSecondary
            className='str-chat__prompt__footer__controls-button--cancel'
            onClick={close}
            type='button'
          >
            {t('common.cancel.label', 'Cancel')}
          </Prompt.FooterControlsButtonSecondary>
          {canSchedule && (
            <Prompt.FooterControlsButtonSecondary
              aria-haspopup='dialog'
              disabled={!canCreatePoll}
              onClick={() => setIsPickingTime(true)}
              type='button'
            >
              <IconClock />
              {t(
                asDynamicKey('viteExample.pollCreationDialog.schedulePoll.text'),
                'Schedule',
              )}
            </Prompt.FooterControlsButtonSecondary>
          )}
          <Prompt.FooterControlsButtonPrimary
            className='str-chat__prompt__footer__controls-button--submit'
            disabled={!canCreatePoll}
            onClick={async () => {
              closeAndFocusComposer();
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
      <GlobalModal
        className='str-chat__schedule-message-modal'
        initialFocusStrategy='dialog'
        onClose={() => setIsPickingTime(false)}
        open={isPickingTime}
      >
        {isPickingTime && (
          <ScheduleTimeDialog
            channel={messageComposer.channel}
            close={() => setIsPickingTime(false)}
            errorMessage={t(
              asDynamicKey('viteExample.pollCreationDialog.schedulePollFailed.text'),
              "Couldn't schedule the poll. Try again",
            )}
            previewMessage={previewMessage}
            submit={schedulePoll}
            title={t(
              asDynamicKey('viteExample.pollCreationDialog.schedulePollTitle.text'),
              'Schedule poll',
            )}
          />
        )}
      </GlobalModal>
    </>
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
