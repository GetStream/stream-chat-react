import React, { type ComponentType, type MouseEvent, useEffect, useState } from 'react';
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

/** The date field of `ScheduleTimeDialog`; values are `YYYY-MM-DD`, as `<input type="date">` takes. */
export type ScheduleDateInputProps = {
  label: string;
  /** The earliest date allowed. */
  min: string;
  onChange: (value: string) => void;
  value: string;
  /** The latest date allowed, when there is a limit. */
  max?: string;
};

/** The time field of `ScheduleTimeDialog`; values are `HH:mm`, as `<input type="time">` takes. */
export type ScheduleTimeInputProps = {
  label: string;
  onChange: (value: string) => void;
  value: string;
};

export type ScheduleTimeDialogProps = {
  channel: Channel;
  close: () => void;
  /** Shown when `submit` rejects with an error that says nothing more specific; the dialog stays open. */
  errorMessage: string;
  previewMessage: LocalMessage;
  /** Closes the dialog once it resolves. */
  submit: (scheduledAt: Date) => Promise<unknown>;
  title: string;
  /** Replaces the date field. */
  DateInput?: ComponentType<ScheduleDateInputProps>;
  initialScheduledAt?: Date;
  /** Above the preview; "Message to {{ name }}" by default. */
  previewLabel?: string;
  submitLabel?: string;
  /** Replaces the time field. */
  TimeInput?: ComponentType<ScheduleTimeInputProps>;
  /** Why an earlier time is refused; "Choose a later time" by default. */
  tooSoonMessage?: string;
};

const BOUNDS_REFRESH_INTERVAL_MS = 60 * 1000;

/** The current time, updated every minute, so time limits computed from it do not go stale. */
const useMinuteClock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), BOUNDS_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);
  return [now, setNow] as const;
};

const DefaultScheduleDateInput = ({
  label,
  max,
  min,
  onChange,
  value,
}: ScheduleDateInputProps) => {
  const { t } = useTranslationContext();
  const { IconCalendar, IconCaretDown } = useComponentContextIcons();
  const selectedDate = fromInputValues(value);
  return (
    <TextInput
      className='str-chat__schedule-message-dialog__date'
      label={label}
      leading={
        <>
          <IconCalendar />
          <span aria-hidden className='str-chat__schedule-message-dialog__date-value'>
            {selectedDate && t('timestamp.ScheduleDate', { timestamp: selectedDate })}
          </span>
        </>
      }
      max={max}
      min={min}
      onChange={({ target }) => onChange(target.value)}
      required
      trailing={<IconCaretDown />}
      type='date'
      value={value}
    />
  );
};

const DefaultScheduleTimeInput = ({ label, onChange, value }: ScheduleTimeInputProps) => {
  const { IconCaretDown, IconClock } = useComponentContextIcons();
  return (
    <TextInput
      className='str-chat__schedule-message-dialog__time'
      label={label}
      leading={<IconClock />}
      onChange={({ target }) => onChange(target.value)}
      required
      trailing={<IconCaretDown />}
      type='time'
      value={value}
    />
  );
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
  DateInput = DefaultScheduleDateInput,
  errorMessage,
  initialScheduledAt,
  previewLabel,
  previewMessage,
  submit,
  submitLabel,
  TimeInput = DefaultScheduleTimeInput,
  title,
  tooSoonMessage,
}: ScheduleTimeDialogProps) => {
  const { t } = useTranslationContext();
  const channelDisplayName = useChannelDisplayName(channel);
  const isOnline = useWSConnectionState()?.isHealthy ?? false;
  const isMounted = useIsMounted();

  // the limits move with the clock: a time allowed when the dialog opened may be too soon later
  const [now, setNow] = useMinuteClock();
  const bounds = getScheduleTimeBounds(channel, now);
  const [initialValue] = useState(
    () => initialScheduledAt ?? getDefaultScheduledAt(bounds),
  );
  const [dateValue, setDateValue] = useState(() => toDateInputValue(initialValue));
  const [timeValue, setTimeValue] = useState(() => toTimeInputValue(initialValue));
  const [status, setStatus] = useState<'failed' | 'idle' | 'submitting'>('idle');
  const [submitError, setSubmitError] = useState<unknown>();

  // the fields hold minutes only: unchanged, they stand for the initial instant itself
  const isUnchanged =
    dateValue === toDateInputValue(initialValue) &&
    timeValue === toTimeInputValue(initialValue);
  const scheduledAt = isUnchanged ? initialValue : fromInputValues(dateValue, timeValue);

  // a failure describes the time it was for, not a newly picked one
  const changeField = (setValue: (value: string) => void) => (value: string) => {
    setValue(value);
    setStatus((current) => (current === 'failed' ? 'idle' : current));
    setSubmitError(undefined);
  };
  const timeError = scheduledAt && getScheduleTimeError(scheduledAt, bounds);
  const canSubmit = !!scheduledAt && !timeError && isOnline && status !== 'submitting';

  const submitScheduledAt = async () => {
    if (!scheduledAt) return;
    // checked again against the limits as of now; a time already passed would be sent at once
    const submittedAt = new Date();
    if (getScheduleTimeError(scheduledAt, getScheduleTimeBounds(channel, submittedAt))) {
      setNow(submittedAt);
      return;
    }
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
          <DateInput
            label={t('scheduledMessages.date', 'Date')}
            max={bounds.latest && toDateInputValue(bounds.latest)}
            min={toDateInputValue(bounds.earliest)}
            onChange={changeField(setDateValue)}
            value={dateValue}
          />
          <TimeInput
            label={t('scheduledMessages.time', 'Time')}
            onChange={changeField(setTimeValue)}
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
