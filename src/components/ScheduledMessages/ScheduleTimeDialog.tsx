import React, { useCallback } from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import type { StreamTFunction } from '../../i18n/types';
import { useWSConnectionState } from '../Chat/hooks/useWSConnectionState';
import { useChannelDisplayName } from '../ChannelListItem/hooks/useChannelDisplayName';
import { Prompt } from '../Dialog';
import { TextInput } from '../Form';
import { QuotedMessagePreviewUI } from '../MessageComposer/QuotedMessagePreview';
import { ScheduleMessageNoticeSeverity, ScheduleTimeError } from './constants';
import { useScheduleTimeForm, useScheduleTimeSubmit } from './hooks';
import { ScheduleMessageDialogNotice } from './ScheduleMessageDialogNotice';
import type { ScheduleTimeDialogProps } from './types';
import {
  formatTimeZoneOffset,
  fromDateInputValue,
  openNativePicker,
  toDateInputValue,
} from './utils';

const translateScheduleTimeError = (
  t: StreamTFunction,
  timeError?: ScheduleTimeError,
) => {
  if (timeError === ScheduleTimeError.TooSoon)
    return t('scheduledMessages.chooseALaterTime', 'Choose a later time');

  if (timeError === ScheduleTimeError.TooFar)
    return t('scheduledMessages.chooseAnEarlierTime', 'Choose an earlier time');

  return undefined;
};

export const ScheduleTimeDialog = ({
  channel,
  close,
  errorMessage,
  initialScheduledAt,
  previewLabel,
  previewMessage,
  submit: submitScheduledAt,
  submitLabel,
  title,
}: ScheduleTimeDialogProps) => {
  const { t } = useTranslationContext();
  const { IconCalendar, IconCaretDown, IconClock } = useComponentContextIcons();

  const channelDisplayName = useChannelDisplayName(channel);
  const isOnline = useWSConnectionState()?.isHealthy ?? false;
  const {
    bounds,
    dateValue,
    onDateChange,
    onTimeChange,
    scheduledAt,
    timeError,
    timeValue,
  } = useScheduleTimeForm({ channel, initialScheduledAt });
  const { hasFailed, isScheduling, submit } = useScheduleTimeSubmit(
    submitScheduledAt,
    close,
  );

  const canSchedule = !!scheduledAt && !timeError && isOnline && !isScheduling;
  const timeErrorMessage = translateScheduleTimeError(t, timeError);
  const timeZone = formatTimeZoneOffset(scheduledAt ?? bounds.earliest);
  const selectedDate = fromDateInputValue(dateValue);
  const dateLabel = selectedDate
    ? t('timestamp.ScheduleDate', { timestamp: selectedDate })
    : undefined;
  const messageToLabel = channelDisplayName
    ? t('scheduledMessages.messageToName', 'Message to {{ name }}', {
        name: channelDisplayName,
      })
    : title;
  const authorLabel = previewLabel ?? messageToLabel;

  const scheduleAtPickedTime = useCallback(() => {
    if (scheduledAt) submit(scheduledAt);
  }, [scheduledAt, submit]);

  return (
    <Prompt.Root
      className='str-chat__schedule-message-dialog'
      data-testid='schedule-message-dialog'
    >
      <Prompt.Header close={close} title={title} />
      <Prompt.Body className='str-chat__schedule-message-dialog__body'>
        <QuotedMessagePreviewUI
          authorLabel={authorLabel}
          className='str-chat__schedule-message-dialog__preview'
          quotedMessage={previewMessage}
        />
        {!isOnline && (
          <ScheduleMessageDialogNotice severity={ScheduleMessageNoticeSeverity.Info}>
            {t(
              'scheduledMessages.youreOfflineReconnectToScheduleThisMessage',
              "You're offline. Reconnect to schedule this message.",
            )}
          </ScheduleMessageDialogNotice>
        )}
        {hasFailed && (
          <ScheduleMessageDialogNotice severity={ScheduleMessageNoticeSeverity.Error}>
            {errorMessage}
          </ScheduleMessageDialogNotice>
        )}
        <div className='str-chat__schedule-message-dialog__fields'>
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
                  {dateLabel}
                </span>
              </>
            }
            max={toDateInputValue(bounds.latest)}
            min={toDateInputValue(bounds.earliest)}
            onChange={onDateChange}
            onClick={openNativePicker}
            required
            trailing={<IconCaretDown />}
            type='date'
            value={dateValue}
          />
          <TextInput
            className='str-chat__schedule-message-dialog__time'
            error={!!timeErrorMessage}
            errorMessage={timeErrorMessage}
            label={t('scheduledMessages.time', 'Time')}
            leading={<IconClock />}
            onChange={onTimeChange}
            onClick={openNativePicker}
            required
            trailing={<IconCaretDown />}
            type='time'
            value={timeValue}
          />
        </div>
        <ScheduleMessageDialogNotice severity={ScheduleMessageNoticeSeverity.Info}>
          {t(
            'scheduledMessages.sentInYourTimeZoneTimezone',
            'Sent in your time zone ({{ timeZone }})',
            { timeZone },
          )}
        </ScheduleMessageDialogNotice>
      </Prompt.Body>
      <Prompt.Footer>
        <Prompt.FooterControls>
          <Prompt.FooterControlsButtonSecondary
            className='str-chat__prompt__footer__controls-button--cancel'
            onClick={close}
          >
            {t('scheduledMessages.cancel', 'Cancel')}
          </Prompt.FooterControlsButtonSecondary>
          <Prompt.FooterControlsButtonPrimary
            className='str-chat__prompt__footer__controls-button--submit'
            disabled={!canSchedule}
            onClick={scheduleAtPickedTime}
            type='submit'
          >
            {submitLabel ?? t('scheduledMessages.schedule', 'Schedule')}
          </Prompt.FooterControlsButtonPrimary>
        </Prompt.FooterControls>
      </Prompt.Footer>
    </Prompt.Root>
  );
};
