import React, { type MouseEvent, useState } from 'react';
import type { Channel, LocalMessage } from 'stream-chat';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import { useIsMounted } from '../Channel/hooks/useIsMounted';
import { useWSConnectionState } from '../Chat/hooks/useWSConnectionState';
import { useChannelDisplayName } from '../ChannelListItem/hooks/useChannelDisplayName';
import { Prompt } from '../Dialog';
import { TextInput } from '../Form';
import { QuotedMessagePreviewUI } from '../MessageComposer/QuotedMessagePreview';
import { ScheduledMessagesNotice } from './ScheduledMessagesNotice';
import {
  formatTimeZoneOffset,
  fromInputValues,
  getDefaultScheduledAt,
  getScheduleTimeBounds,
  getScheduleTimeError,
  toDateInputValue,
  toTimeInputValue,
  translateScheduledMessageError,
} from './utils';

export type ScheduleTimeDialogProps = {
  channel: Channel;
  close: () => void;
  /** Shown when `submit` rejects with an error that says nothing more specific; the dialog stays open. */
  errorMessage: string;
  previewMessage: LocalMessage;
  /** Closes the dialog once it resolves. */
  submit: (scheduledAt: Date) => Promise<unknown>;
  title: string;
  initialScheduledAt?: Date;
  /** Above the preview; "Message to {{ name }}" by default. */
  previewLabel?: string;
  submitLabel?: string;
  /** Why an earlier time is refused; "Choose a later time" by default. */
  tooSoonMessage?: string;
};

/** A click anywhere in a field, its icons included, opens the field's picker. */
const openNativePicker = ({ target }: MouseEvent<HTMLElement>) => {
  const input = (target as Element)
    .closest('.str-chat__form-text-input__wrapper')
    ?.querySelector('input');
  try {
    input?.showPicker?.();
  } catch {
    // not allowed outside a user gesture in some browsers
  }
};

/** Picks a date and time within the channel's limits and submits it. */
export const ScheduleTimeDialog = ({
  channel,
  close,
  errorMessage,
  initialScheduledAt,
  previewLabel,
  previewMessage,
  submit,
  submitLabel,
  title,
  tooSoonMessage,
}: ScheduleTimeDialogProps) => {
  const { t } = useTranslationContext();
  const { IconCalendar, IconCaretDown, IconClock } = useComponentContextIcons();
  const channelDisplayName = useChannelDisplayName(channel);
  const isOnline = useWSConnectionState()?.isHealthy ?? false;
  const isMounted = useIsMounted();

  const [bounds] = useState(() => getScheduleTimeBounds(channel));
  const [dateValue, setDateValue] = useState(() =>
    toDateInputValue(initialScheduledAt ?? getDefaultScheduledAt(bounds)),
  );
  const [timeValue, setTimeValue] = useState(() =>
    toTimeInputValue(initialScheduledAt ?? getDefaultScheduledAt(bounds)),
  );
  const [status, setStatus] = useState<'failed' | 'idle' | 'submitting'>('idle');
  const [submitError, setSubmitError] = useState<unknown>();

  const scheduledAt = fromInputValues(dateValue, timeValue);
  const timeError = scheduledAt && getScheduleTimeError(scheduledAt, bounds);
  const selectedDate = fromInputValues(dateValue);
  const canSubmit = !!scheduledAt && !timeError && isOnline && status !== 'submitting';

  const submitScheduledAt = async () => {
    if (!scheduledAt) return;
    setStatus('submitting');
    try {
      await submit(scheduledAt);
      if (isMounted.current) close();
    } catch (error) {
      if (!isMounted.current) return;
      setSubmitError(error);
      setStatus('failed');
    }
  };

  return (
    <Prompt.Root
      className='str-chat__schedule-message-dialog'
      data-testid='schedule-message-dialog'
    >
      <Prompt.Header close={close} title={title} />
      <Prompt.Body className='str-chat__schedule-message-dialog__body'>
        <QuotedMessagePreviewUI
          authorLabel={
            previewLabel ??
            (channelDisplayName
              ? t('scheduledMessages.messageToName', 'Message to {{ name }}', {
                  name: channelDisplayName,
                })
              : title)
          }
          className='str-chat__schedule-message-dialog__preview'
          quotedMessage={previewMessage}
        />
        {!isOnline && (
          <ScheduledMessagesNotice>
            {t(
              'scheduledMessages.youreOfflineReconnectToScheduleThisMessage',
              "You're offline. Reconnect to schedule this message.",
            )}
          </ScheduledMessagesNotice>
        )}
        {status === 'failed' && (
          <ScheduledMessagesNotice isError>
            {translateScheduledMessageError(t, submitError) ?? errorMessage}
          </ScheduledMessagesNotice>
        )}
        <div
          className='str-chat__schedule-message-dialog__fields'
          onClick={openNativePicker}
        >
          <TextInput
            className='str-chat__schedule-message-dialog__date'
            label={t('scheduledMessages.date', 'Date')}
            leading={
              <>
                <IconCalendar />
                <span
                  aria-hidden
                  className='str-chat__schedule-message-dialog__date-value'
                >
                  {selectedDate &&
                    t('timestamp.ScheduleDate', { timestamp: selectedDate })}
                </span>
              </>
            }
            max={bounds.latest && toDateInputValue(bounds.latest)}
            min={toDateInputValue(bounds.earliest)}
            onChange={({ target }) => setDateValue(target.value)}
            required
            trailing={<IconCaretDown />}
            type='date'
            value={dateValue}
          />
          <TextInput
            className='str-chat__schedule-message-dialog__time'
            label={t('scheduledMessages.time', 'Time')}
            leading={<IconClock />}
            onChange={({ target }) => setTimeValue(target.value)}
            required
            trailing={<IconCaretDown />}
            type='time'
            value={timeValue}
          />
        </div>
        {/* a time out of bounds takes the time zone's place */}
        {timeError ? (
          <ScheduledMessagesNotice isError>
            {timeError === 'tooSoon'
              ? (tooSoonMessage ??
                t('scheduledMessages.chooseALaterTime', 'Choose a later time'))
              : t('scheduledMessages.chooseAnEarlierTime', 'Choose an earlier time')}
          </ScheduledMessagesNotice>
        ) : (
          <ScheduledMessagesNotice>
            {t(
              'scheduledMessages.sentInYourTimeZoneTimezone',
              'Sent in your time zone ({{ timeZone }})',
              { timeZone: formatTimeZoneOffset(scheduledAt ?? bounds.earliest) },
            )}
          </ScheduledMessagesNotice>
        )}
      </Prompt.Body>
      <Prompt.Footer>
        <Prompt.FooterControls>
          <Prompt.FooterControlsButtonSecondary onClick={close}>
            {t('scheduledMessages.cancel', 'Cancel')}
          </Prompt.FooterControlsButtonSecondary>
          <Prompt.FooterControlsButtonPrimary
            disabled={!canSubmit}
            onClick={submitScheduledAt}
            type='submit'
          >
            {submitLabel ?? t('scheduledMessages.schedule', 'Schedule')}
          </Prompt.FooterControlsButtonPrimary>
        </Prompt.FooterControls>
      </Prompt.Footer>
    </Prompt.Root>
  );
};
