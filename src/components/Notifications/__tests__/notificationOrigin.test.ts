import {
  getNotificationTargetPanel,
  isNotificationForPanel,
  isNotificationTargetPanel,
} from '../notificationTarget';

import type { Notification } from 'stream-chat';

const notification = (panel?: unknown) =>
  ({
    createdAt: Date.now(),
    id: 'n1',
    message: 'test',
    origin: {
      context: panel === undefined ? {} : { panel },
      emitter: 'test',
    },
    severity: 'info',
  }) as Notification;

const taggedNotification = (tag: string) =>
  ({
    createdAt: Date.now(),
    id: 'n2',
    message: 'test',
    origin: {
      context: {},
      emitter: 'test',
    },
    severity: 'info',
    tags: [tag],
  }) as Notification;

describe('notificationOrigin helpers', () => {
  it('recognizes supported panel values', () => {
    expect(isNotificationTargetPanel('channel')).toBe(true);
    expect(isNotificationTargetPanel('thread')).toBe(true);
    expect(isNotificationTargetPanel('channel-list')).toBe(true);
    expect(isNotificationTargetPanel('thread-list')).toBe(true);
    expect(isNotificationTargetPanel('unknown')).toBe(false);
  });

  it('extracts panel from notification origin context', () => {
    expect(getNotificationTargetPanel(notification('thread-list'))).toBe('thread-list');
    expect(getNotificationTargetPanel(notification('invalid-panel'))).toBeUndefined();
  });

  it('extracts panel from target tag when present', () => {
    expect(getNotificationTargetPanel(taggedNotification('target:channel-list'))).toBe(
      'channel-list',
    );
  });

  it('falls back to channel panel when panel is missing', () => {
    expect(isNotificationForPanel(notification(), 'channel')).toBe(true);
    expect(isNotificationForPanel(notification(), 'thread')).toBe(false);
  });

  it('matches explicit target panel when present', () => {
    expect(isNotificationForPanel(notification('thread'), 'thread')).toBe(true);
    expect(isNotificationForPanel(notification('thread'), 'channel')).toBe(false);
  });
});
