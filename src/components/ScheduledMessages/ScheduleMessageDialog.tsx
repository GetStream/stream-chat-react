import React, { useCallback } from 'react';
import type { TFunction } from 'i18next';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import { useChannelDisplayName } from '../ChannelListItem/hooks/useChannelDisplayName';
import { Prompt } from '../Dialog';
import { TextInput } from '../Form';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { QuotedMessagePreviewUI } from '../MessageComposer/QuotedMessagePreview';
import { ScheduleMessageNoticeSeverity, ScheduleTimeError } from './constants';
import {
  useIsConnectionOnline,
  useScheduledMessagePreview,
  useScheduleMessageSubmit,
  useScheduleTimeForm,
} from './hooks';
import { ScheduleMessageDialogNotice } from './ScheduleMessageDialogNotice';
import type { ScheduleMessageDialogProps } from './types';
import { formatTimeZoneOffset, openNativePicker, toDateInputValue } from './utils';

const translateScheduleTimeError = (t: TFunction, timeError?: ScheduleTimeError) => {
  if (timeError === ScheduleTimeError.TooSoon) return t('Choose a later time');

  if (timeError === ScheduleTimeError.TooFar) return t('Choose an earlier time');

  return undefined;
};

export const ScheduleMessageDialog = ({ close }: ScheduleMessageDialogProps) => {
  const { t } = useTranslationContext();
  const { IconCalendar, IconClock } = useComponentContextIcons();

  const { channel } = useMessageComposerController();
  const channelDisplayName = useChannelDisplayName(channel);
  const previewMessage = useScheduledMessagePreview();
  const isOnline = useIsConnectionOnline();
  const {
    bounds,
    dateValue,
    onDateChange,
    onTimeChange,
    scheduledAt,
    timeError,
    timeValue,
  } = useScheduleTimeForm();
  const { hasFailed, isScheduling, submit } = useScheduleMessageSubmit(close);

  const canSchedule = !!scheduledAt && !timeError && isOnline && !isScheduling;
  const timeErrorMessage = translateScheduleTimeError(t, timeError);
  const timeZone = formatTimeZoneOffset(scheduledAt ?? bounds.earliest);
  const authorLabel = channelDisplayName
    ? t('Message to {{ name }}', { name: channelDisplayName })
    : t('Schedule message');

  const scheduleAtPickedTime = useCallback(() => {
    if (scheduledAt) submit(scheduledAt);
  }, [scheduledAt, submit]);

  return (
    <Prompt.Root
      className='str-chat__schedule-message-dialog'
      data-testid='schedule-message-dialog'
    >
      <Prompt.Header close={close} title={t('Schedule message')} />
      <Prompt.Body className='str-chat__schedule-message-dialog__body'>
        <QuotedMessagePreviewUI
          authorLabel={authorLabel}
          className='str-chat__schedule-message-dialog__preview'
          quotedMessage={previewMessage}
        />
        {!isOnline && (
          <ScheduleMessageDialogNotice severity={ScheduleMessageNoticeSeverity.Info}>
            {t("You're offline. Reconnect to schedule this message.")}
          </ScheduleMessageDialogNotice>
        )}
        {hasFailed && (
          <ScheduleMessageDialogNotice severity={ScheduleMessageNoticeSeverity.Error}>
            {t("Couldn't schedule message. Try again")}
          </ScheduleMessageDialogNotice>
        )}
        <div className='str-chat__schedule-message-dialog__fields'>
          <TextInput
            className='str-chat__schedule-message-dialog__date'
            label={t('Date')}
            leading={<IconCalendar />}
            max={toDateInputValue(bounds.latest)}
            min={toDateInputValue(bounds.earliest)}
            onChange={onDateChange}
            onClick={openNativePicker}
            required
            type='date'
            value={dateValue}
          />
          <TextInput
            className='str-chat__schedule-message-dialog__time'
            error={!!timeErrorMessage}
            errorMessage={timeErrorMessage}
            label={t('Time')}
            leading={<IconClock />}
            onChange={onTimeChange}
            onClick={openNativePicker}
            required
            type='time'
            value={timeValue}
          />
        </div>
        <ScheduleMessageDialogNotice severity={ScheduleMessageNoticeSeverity.Info}>
          {t('Sent in your time zone ({{ timeZone }})', { timeZone })}
        </ScheduleMessageDialogNotice>
      </Prompt.Body>
      <Prompt.Footer>
        <Prompt.FooterControls>
          <Prompt.FooterControlsButtonSecondary
            className='str-chat__prompt__footer__controls-button--cancel'
            onClick={close}
          >
            {t('Cancel')}
          </Prompt.FooterControlsButtonSecondary>
          <Prompt.FooterControlsButtonPrimary
            className='str-chat__prompt__footer__controls-button--submit'
            disabled={!canSchedule}
            onClick={scheduleAtPickedTime}
            type='submit'
          >
            {t('Schedule')}
          </Prompt.FooterControlsButtonPrimary>
        </Prompt.FooterControls>
      </Prompt.Footer>
    </Prompt.Root>
  );
};
