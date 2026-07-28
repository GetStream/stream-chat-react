import { fromPartial } from '@total-typescript/shoehorn';

import type { LocalMessage, StreamChat } from 'stream-chat';
import type { TranslationContextValue } from '../../../../context/TranslationContext';

import {
  composeThreadListItemAccessibleLabel,
  DEFAULT_THREAD_LIST_ITEM_LABEL_ORDER,
} from '../utils.a11y';

// Mirrors the natural-language fallback: interpolate {{ name }} and drop the `aria/` prefix. The
// `replyCount` plural key carries no placeholder in the key itself, so special-case it.
const t = ((key: string, opts?: Record<string, unknown>) => {
  if (key === 'replyCount') return `${opts?.count} replies`;
  const interpolated = Object.entries(opts ?? {}).reduce(
    (value, [name, arg]) => value.replace(`{{ ${name} }}`, String(arg)),
    key,
  );
  return interpolated.startsWith('aria/')
    ? interpolated.replace('aria/', '')
    : interpolated;
}) as TranslationContextValue['t'];

const tDateTimeParser = (() =>
  'recently') as unknown as TranslationContextValue['tDateTimeParser'];

const client = fromPartial<StreamChat>({ userID: 'me' });

const baseData = {
  client,
  displayTitle: 'General',
  latestReply: fromPartial<LocalMessage>({ created_at: new Date() }),
  parentMessagePreview: 'hello world',
  replyCount: 3,
  t,
  tDateTimeParser,
  unreadCount: 2,
};

describe('composeThreadListItemAccessibleLabel', () => {
  it('composes name, unread, parent message, reply count, and time in reading order', () => {
    expect(composeThreadListItemAccessibleLabel(baseData)).toBe(
      'Chat: General. 2 unread message. Thread: hello world. 3 replies. Last activity: recently',
    );
  });

  it('announces the active state right after the name', () => {
    const label = composeThreadListItemAccessibleLabel({ ...baseData, active: true });
    expect(label.startsWith('Chat: General. Active')).toBe(true);
  });

  it('omits the active state when not active', () => {
    expect(composeThreadListItemAccessibleLabel(baseData)).not.toContain('Active');
  });

  it('omits unread and reply count when zero', () => {
    const label = composeThreadListItemAccessibleLabel({
      ...baseData,
      replyCount: 0,
      unreadCount: 0,
    });
    expect(label).not.toContain('unread');
    expect(label).not.toContain('replies');
    expect(label).toBe('Chat: General. Thread: hello world. Last activity: recently');
  });

  it('prefixes the parent message preview with the sender when present', () => {
    const label = composeThreadListItemAccessibleLabel({
      ...baseData,
      parentMessagePreview: 'on my way',
      parentMessageSender: 'You',
    });
    expect(label).toContain('Thread: You: on my way');
  });

  it('omits the parent message segment when there is no preview', () => {
    const label = composeThreadListItemAccessibleLabel({
      ...baseData,
      parentMessagePreview: undefined,
    });
    expect(label).not.toContain('Thread:');
  });

  it('honors a config: custom order, an overridden part, and a separator', () => {
    const label = composeThreadListItemAccessibleLabel(baseData, {
      order: ['name', 'replyCount'],
      parts: { name: ({ displayTitle }) => `Thread in ${displayTitle}` },
      separator: ' — ',
    });
    expect(label).toBe('Thread in General — 3 replies');
  });

  it('honors a full build override', () => {
    const label = composeThreadListItemAccessibleLabel(baseData, {
      build: ({ displayTitle }) => `Custom: ${displayTitle}`,
    });
    expect(label).toBe('Custom: General');
  });

  it('exposes the default reading order', () => {
    expect(DEFAULT_THREAD_LIST_ITEM_LABEL_ORDER).toEqual([
      'name',
      'active',
      'unreadCount',
      'parentMessage',
      'replyCount',
      'time',
    ]);
  });
});
