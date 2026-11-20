import { type FormEvent, useEffect, useId, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  asDynamicKey,
  type AttachmentSelectorModalContentProps,
  Button,
  Prompt,
  TextInput,
  useAriaLiveAnnouncer,
  useMessageComposerContext,
  useMessageComposerController,
  useTranslationContext,
} from 'stream-chat-react';

import {
  EVENT_INVITE_ATTACHMENT_TYPE,
  type EventInviteData,
  generateEventInviteUid,
} from './eventInvite';

const DURATIONS_MINUTES = [15, 30, 60, 120];
const DEFAULT_DURATION_MINUTES = 60;

const padded = (value: number) => String(value).padStart(2, '0');

/** A local date as the value of a date input: `2026-11-14`. */
const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${padded(date.getMonth() + 1)}-${padded(date.getDate())}`;

/**
 * Today, the earliest date the picker offers, and the next full hour in local time, as the
 * values of a date and a time input.
 */
const getDefaultStart = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(start.getHours() + 1, 0, 0, 0);
  return {
    date: toDateInputValue(start),
    minDate: toDateInputValue(now),
    time: `${padded(start.getHours())}:${padded(start.getMinutes())}`,
  };
};

/**
 * The picker of the attachment selector's Event action. It adds an `event` attachment to the
 * message being composed, so the invite goes out with the message's text once it is sent.
 */
export const EventInviteDialog = ({ close }: AttachmentSelectorModalContentProps) => {
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposerController();
  const { textareaRef } = useMessageComposerContext();
  const announce = useAriaLiveAnnouncer();
  const durationLabelId = useId();
  const defaultStart = useMemo(getDefaultStart, []);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultStart.date);
  const [time, setTime] = useState(defaultStart.time);
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION_MINUTES);
  const [location, setLocation] = useState('');

  // The dialog surface takes focus on open, and Enter moves it to the Title field
  // (`data-autofocus`). Said out loud, since nothing on screen says so. Assertive: a polite
  // message made around the dialog's own announcement is dropped.
  useEffect(
    () =>
      announce(
        `${t(asDynamicKey('viteExample.eventInvite.dialog.opened.ariaLabel'), 'Create event dialog opened')}. ${t(
          'a11y.interactionAnnouncements.pressEnterStartTyping.ariaLabel',
          'Press Enter to start typing',
        )}.`,
        { dedupeMs: 1000, priority: 'assertive' },
      ),
    [announce, t],
  );

  // An ISO date and time without an offset is read as local time.
  const start = new Date(`${date}T${time}`);
  const canSubmit = !!title.trim() && !Number.isNaN(start.getTime());

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const eventData: EventInviteData = {
      ends_at: end.toISOString(),
      starts_at: start.toISOString(),
      uid: generateEventInviteUid(),
      ...(location.trim() && { location: location.trim() }),
    };
    // Nothing to upload: the attachment manager gives it a local id, and an attachment with no
    // file is sent as it is.
    messageComposer.attachmentManager.upsertAttachments([
      {
        custom: { event: eventData },
        title: title.trim(),
        type: EVENT_INVITE_ATTACHMENT_TYPE,
      },
    ]);
    // The dialog closes and the textarea takes focus in one synchronous turn, so the message can
    // be written straight away. The modal and the attachment selector restore focus to the menu
    // button only when it fell to <body>, which it no longer does.
    flushSync(() => close());
    textareaRef?.current?.focus();
  };

  return (
    <Prompt.Root className='app__event-invite-dialog' data-testid='event-invite-dialog'>
      <Prompt.Header
        close={close}
        description={t(
          asDynamicKey('viteExample.eventInvite.dialog.description'),
          'Add an event to the message. Everyone in the channel can save it to their calendar.',
        )}
        title={t(asDynamicKey('viteExample.eventInvite.dialog.title'), 'Create event')}
      />
      <form className='app__event-invite-dialog__form' onSubmit={submit}>
        <Prompt.Body className='app__event-invite-dialog__body'>
          <TextInput
            data-autofocus
            label={t(asDynamicKey('viteExample.eventInvite.title.label'), 'Title')}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t(
              asDynamicKey('viteExample.eventInvite.title.placeholder'),
              'Team lunch',
            )}
            required
            value={title}
          />
          <div className='app__event-invite-dialog__row'>
            <TextInput
              label={t(asDynamicKey('viteExample.eventInvite.date.label'), 'Date')}
              min={defaultStart.minDate}
              onChange={(event) => setDate(event.target.value)}
              required
              type='date'
              value={date}
            />
            <TextInput
              label={t(asDynamicKey('viteExample.eventInvite.startTime.label'), 'Starts')}
              onChange={(event) => setTime(event.target.value)}
              required
              type='time'
              value={time}
            />
          </div>
          <div className='app__event-invite-dialog__field'>
            <div className='app__event-invite-dialog__field-label' id={durationLabelId}>
              {t(asDynamicKey('viteExample.eventInvite.duration.label'), 'Duration')}
            </div>
            <div
              aria-labelledby={durationLabelId}
              className='app__event-invite-dialog__durations'
              role='group'
            >
              {DURATIONS_MINUTES.map((minutes) => (
                <Button
                  appearance='outline'
                  aria-pressed={durationMinutes === minutes}
                  className='app__event-invite-dialog__duration'
                  key={minutes}
                  onClick={() => setDurationMinutes(minutes)}
                  size='sm'
                  type='button'
                  variant='secondary'
                >
                  {minutes < 60
                    ? t(asDynamicKey('viteExample.eventInvite.duration.minutes.text'), {
                        count: minutes,
                        defaultValue_one: '{{ count }} min',
                        defaultValue_other: '{{ count }} min',
                      })
                    : t(asDynamicKey('viteExample.eventInvite.duration.hours.text'), {
                        count: minutes / 60,
                        defaultValue_one: '{{ count }} hour',
                        defaultValue_other: '{{ count }} hours',
                      })}
                </Button>
              ))}
            </div>
          </div>
          <TextInput
            label={t(
              asDynamicKey('viteExample.eventInvite.location.label'),
              'Place or meeting link (optional)',
            )}
            onChange={(event) => setLocation(event.target.value)}
            placeholder={t(
              asDynamicKey('viteExample.eventInvite.location.placeholder'),
              'https://meet.example.com/…',
            )}
            value={location}
          />
        </Prompt.Body>
        <Prompt.Footer>
          <Prompt.FooterControls>
            <Prompt.FooterControlsButtonSecondary onClick={close} type='button'>
              {t('common.cancel.label', 'Cancel')}
            </Prompt.FooterControlsButtonSecondary>
            <Prompt.FooterControlsButtonPrimary disabled={!canSubmit} type='submit'>
              {t(asDynamicKey('viteExample.eventInvite.dialog.submit.text'), 'Add event')}
            </Prompt.FooterControlsButtonPrimary>
          </Prompt.FooterControls>
        </Prompt.Footer>
      </form>
    </Prompt.Root>
  );
};
