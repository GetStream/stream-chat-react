import { useId } from 'react';
import {
  asDynamicKey,
  AttachmentPreviewList,
  Button,
  RemoveAttachmentPreviewButton,
  UnsupportedAttachment,
  UnsupportedAttachmentPreview,
  type UnsupportedAttachmentPreviewProps,
  type UnsupportedAttachmentProps,
  useTranslationContext,
  VisuallyHidden,
} from 'stream-chat-react';

import { IconCalendar } from '../icons';
import {
  downloadEventInviteIcs,
  type EventInviteAttachment,
  type EventInviteData,
  formatEventInviteSchedule,
  getEventInviteLink,
  isEventInviteAttachment,
  toIntlLocale,
} from './eventInvite';

/** The viewer's locale for dates and times: the SDK's language. */
const useEventInviteLocale = () => toIntlLocale(useTranslationContext().userLanguage);

/** The start day as a calendar tile: month above day. Decorative: the schedule line says it. */
const EventInviteDateTile = ({ event }: { event: EventInviteData }) => {
  const locale = useEventInviteLocale();
  const start = new Date(event.starts_at);
  return (
    <div aria-hidden className='app__event-invite__date-tile'>
      <span className='app__event-invite__date-tile-month'>
        {new Intl.DateTimeFormat(locale, { month: 'short' }).format(start)}
      </span>
      <span className='app__event-invite__date-tile-day'>
        {new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(start)}
      </span>
    </div>
  );
};

/** Title, schedule and place of an invite. A meeting link opens in a new tab. */
const EventInviteDetails = ({
  attachment,
  titleId,
}: {
  attachment: EventInviteAttachment;
  titleId?: string;
}) => {
  const { t } = useTranslationContext();
  const locale = useEventInviteLocale();
  const { event } = attachment.custom;
  const link = getEventInviteLink(event);
  return (
    <div className='app__event-invite__details'>
      <div className='app__event-invite__title' id={titleId} title={attachment.title}>
        {attachment.title}
      </div>
      <time className='app__event-invite__schedule' dateTime={event.starts_at}>
        {formatEventInviteSchedule(event, locale)}
      </time>
      {event.location && (
        <div className='app__event-invite__location'>
          {link ? (
            <a
              href={link.href}
              rel='noopener noreferrer'
              target='_blank'
              title={link.href}
            >
              {link.host}
              <VisuallyHidden>
                {` (${t(asDynamicKey('viteExample.eventInvite.link.opensInNewTab.text'), 'opens in a new tab')})`}
              </VisuallyHidden>
            </a>
          ) : (
            event.location
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Renders an `event` attachment in a message: the `UnsupportedAttachment` of the app's
 * `Attachment`, since the SDK hands every type it does not know to that component. Any other
 * unknown type keeps the SDK's UI.
 */
export const EventInviteMessageAttachment = ({
  attachment,
}: UnsupportedAttachmentProps) => {
  const { t } = useTranslationContext();
  const titleId = useId();

  if (!isEventInviteAttachment(attachment)) return <UnsupportedAttachment />;

  return (
    <div className='app__event-invite' data-testid='event-invite-attachment'>
      <div className='app__event-invite__summary'>
        <EventInviteDateTile event={attachment.custom.event} />
        <EventInviteDetails attachment={attachment} titleId={titleId} />
      </div>
      <Button
        appearance='outline'
        // Names which invite the button saves, since a channel can hold several.
        aria-describedby={titleId}
        className='app__event-invite__add-to-calendar'
        onClick={() => downloadEventInviteIcs(attachment)}
        size='sm'
        variant='secondary'
      >
        <IconCalendar />
        {t(asDynamicKey('viteExample.eventInvite.addToCalendar.text'), 'Add to calendar')}
      </Button>
    </div>
  );
};

/**
 * Previews an `event` attachment in the composer, with a button that removes it from the message.
 * Any other unknown type keeps the SDK's preview.
 */
export const EventInviteAttachmentPreview = (
  props: UnsupportedAttachmentPreviewProps,
) => {
  const { t } = useTranslationContext();
  const { attachment, removeAttachments } = props;

  if (!isEventInviteAttachment(attachment))
    return <UnsupportedAttachmentPreview {...props} />;

  return (
    <div className='app__event-invite-preview' data-testid='event-invite-preview'>
      <EventInviteDateTile event={attachment.custom.event} />
      <EventInviteDetails attachment={attachment} />
      <RemoveAttachmentPreviewButton
        aria-label={t(asDynamicKey('viteExample.eventInvite.preview.remove.ariaLabel'), {
          defaultValue: 'Remove event {{ title }}',
          title: attachment.title,
        })}
        data-testid='event-invite-preview-delete-button'
        onClick={() => removeAttachments([attachment.localMetadata.id])}
      />
    </div>
  );
};

/** The composer's attachment previews, with `event` attachments previewed as invites. */
export const EventInviteAwareAttachmentPreviewList = () => (
  <AttachmentPreviewList UnsupportedAttachmentPreview={EventInviteAttachmentPreview} />
);
