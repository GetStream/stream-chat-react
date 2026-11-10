import type { Attachment, CustomAttachmentData } from 'stream-chat';

/** The attachment `type` of an event invite. The SDK has no renderer for it of its own. */
export const EVENT_INVITE_ATTACHMENT_TYPE = 'event';

export type EventInviteData = NonNullable<CustomAttachmentData['event']>;

export type EventInviteAttachment = Attachment & {
  custom: CustomAttachmentData & { event: EventInviteData };
  title: string;
  type: typeof EVENT_INVITE_ATTACHMENT_TYPE;
};

const isValidTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

const isOptionalString = (value: unknown) =>
  value === undefined || typeof value === 'string';

/**
 * An `event` attachment this app can render. Another client may send an `event` attachment of a
 * different shape, which falls back to the SDK's unsupported attachment UI rather than reaching
 * the card, where a non-string field would break the render.
 */
export const isEventInviteAttachment = (
  attachment: Attachment,
): attachment is EventInviteAttachment => {
  const event: unknown = attachment.custom?.event;
  if (
    attachment.type !== EVENT_INVITE_ATTACHMENT_TYPE ||
    typeof attachment.title !== 'string' ||
    typeof event !== 'object' ||
    event === null
  )
    return false;
  const { ends_at, location, starts_at, uid } = event as Record<string, unknown>;
  return (
    isValidTimestamp(starts_at) &&
    isValidTimestamp(ends_at) &&
    // RFC 5545 needs an event to end after it starts.
    Date.parse(ends_at) > Date.parse(starts_at) &&
    isOptionalString(location) &&
    isOptionalString(uid)
  );
};

/** A random id for a new invite, which keeps its calendar entry apart from any other event. */
export const generateEventInviteUid = () =>
  // `getRandomValues`, unlike `randomUUID`, also works outside a secure context (plain http on
  // a LAN address).
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');

/** The event's `location` as a URL when it is an http(s) link, which renders as a link. */
export const getEventInviteLink = ({ location }: EventInviteData) => {
  if (!location) return;
  try {
    const url = new URL(location.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : undefined;
  } catch {
    return;
  }
};

/**
 * The SDK's language as a locale `Intl` accepts, or `undefined` for the browser's own. The
 * language can be empty or a tag `Intl` rejects, and `Intl.DateTimeFormat` throws on those.
 */
export const toIntlLocale = (language: string | undefined) => {
  if (!language) return;
  try {
    return Intl.getCanonicalLocales(language)[0];
  } catch {
    return;
  }
};

const isSameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * When the event happens, in the viewer's language and time zone: `Fri, 14 Nov · 15:00 – 16:00`,
 * or both full dates for an event that ends on another day.
 */
export const formatEventInviteSchedule = (
  { ends_at, starts_at }: EventInviteData,
  locale: string | undefined,
) => {
  const start = new Date(starts_at);
  const end = new Date(ends_at);
  const date = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  });
  const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });

  if (isSameLocalDay(start, end)) {
    return `${date.format(start)} · ${time.format(start)} – ${time.format(end)}`;
  }
  return `${date.format(start)} ${time.format(start)} – ${date.format(end)} ${time.format(end)}`;
};

/** A uid this app generates, or one as plain: letters, digits, dots, dashes and underscores. */
const ICS_UID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

/** iCalendar UTC date-time: `20261114T150000Z`. */
const toIcsDateTime = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

/**
 * Escapes iCalendar TEXT (RFC 5545 §3.3.11). Line breaks of any kind become `\n`, and the other
 * control characters, which TEXT does not allow, are dropped.
 */
const escapeIcsText = (text: string) =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
    // eslint-disable-next-line no-control-regex -- matching control characters is the point
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '');

const utf8 = new TextEncoder();

/** Folds a content line into lines of at most 75 octets (RFC 5545 §3.1). */
const foldIcsLine = (line: string) => {
  const lines: string[] = [];
  let current = '';
  let currentOctets = 0;
  for (const character of line) {
    const octets = utf8.encode(character).length;
    // Continuation lines start with a space, which counts toward their 75 octets.
    const limit = lines.length ? 74 : 75;
    if (currentOctets + octets > limit) {
      lines.push(current);
      current = '';
      currentOctets = 0;
    }
    current += character;
    currentOctets += octets;
  }
  lines.push(current);
  return lines.join('\r\n ');
};

/**
 * The invite as an iCalendar file that a calendar app imports. The UID is the invite's own, so
 * importing the same invite twice updates the entry instead of adding another. An invite without
 * a plain one (sent by another client) gets a UID derived from its start and title.
 */
export const buildEventInviteIcs = (attachment: EventInviteAttachment) => {
  const { ends_at, location, starts_at, uid } = attachment.custom.event;
  const start = new Date(starts_at);
  const link = getEventInviteLink(attachment.custom.event);
  // The uid comes from whoever sent the invite and goes into the file unescaped, so only a plain
  // token is used: a line break in it would add lines of the sender's choosing.
  const icsUid = `${uid && ICS_UID_PATTERN.test(uid) ? uid : `${toIcsDateTime(start)}-${encodeURIComponent(attachment.title)}`}@stream-chat-react.example`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stream//stream-chat-react vite example//EN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${icsUid}`,
    `DTSTAMP:${toIcsDateTime(new Date())}`,
    `DTSTART:${toIcsDateTime(start)}`,
    `DTEND:${toIcsDateTime(new Date(ends_at))}`,
    `SUMMARY:${escapeIcsText(attachment.title)}`,
    location && `LOCATION:${escapeIcsText(location)}`,
    link && `URL:${link.href}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter((line): line is string => !!line)
    .map(foldIcsLine)
    .join('\r\n')
    .concat('\r\n');
};

/** Saves the invite as an `.ics` file, which the browser hands to the calendar app. */
export const downloadEventInviteIcs = (attachment: EventInviteAttachment) => {
  const blob = new Blob([buildEventInviteIcs(attachment)], {
    type: 'text/calendar;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${attachment.title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'event'}.ics`;
  // Attached for the click, which some browsers ignore on a detached anchor, and the URL is kept
  // for a while: some browsers fail a download whose URL is revoked straight away.
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};
