import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { useChatContext } from '../../../../context';
import { useNotificationTarget } from '../useNotificationTarget';
import { useNotificationApi } from '../useNotificationApi';

vi.mock('../../../../context', () => ({
  useChatContext: vi.fn(),
}));

vi.mock('../useNotificationTarget', () => ({
  useNotificationTarget: vi.fn(),
}));

const add = vi.fn();
const remove = vi.fn();
const startTimeout = vi.fn();

const mockedUseChatContext = vi.mocked(useChatContext);
const mockedUseNotificationTarget = vi.mocked(useNotificationTarget);

describe('useNotificationApi', () => {
  beforeEach(() => {
    mockedUseNotificationTarget.mockReturnValue('channel');
    mockedUseChatContext.mockReturnValue(
      fromPartial({
        client: {
          notifications: {
            add,
            remove,
            startTimeout,
          },
        },
      }),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('removes notification by id', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.removeNotification('notification-id');

    expect(remove).toHaveBeenCalledWith('notification-id');
  });

  it('starts notification timeout by id', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.startNotificationTimeout('notification-id');

    expect(startTimeout).toHaveBeenCalledWith('notification-id');
  });

  it('adds inferred target panel tag when targetPanels is not provided', () => {
    mockedUseNotificationTarget.mockReturnValue('thread');

    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'MessageComposer',
      message: 'Send message request failed',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Send message request failed',
      options: { tags: ['target:thread'] },
      origin: { emitter: 'MessageComposer' },
    });
  });

  it('uses explicit target panels and ignores inferred panel tag', () => {
    mockedUseNotificationTarget.mockReturnValue('channel');

    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'ChannelListItemActionButtons',
      message: 'Failed to update channel mute status',
      severity: 'error',
      tags: ['custom-tag'],
      targetPanels: ['thread', 'channel-list'],
      type: 'api:channel:mute:failed',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Failed to update channel mute status',
      options: {
        severity: 'error',
        tags: ['target:thread', 'target:channel-list', 'custom-tag'],
        type: 'api:channel:mute:failed',
      },
      origin: { emitter: 'ChannelListItemActionButtons' },
    });
  });

  it('allows passing targetPanels as an empty array to skip inferred panel tag', () => {
    mockedUseNotificationTarget.mockReturnValue('thread-list');

    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'Message',
      message: 'Skipped panel tag',
      targetPanels: [],
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Skipped panel tag',
      options: {},
      origin: { emitter: 'Message' },
    });
  });

  it('falls back to notifications.add for severities without dedicated helpers', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'NotificationPromptDialog',
      message: 'Heads up',
      severity: 'warning',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Heads up',
      options: { severity: 'warning', tags: ['target:channel'] },
      origin: { emitter: 'NotificationPromptDialog' },
    });
  });

  it('passes explicit type as-is', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'MessageComposer',
      message: 'Edit message request failed',
      severity: 'error',
      type: 'api:message:edit:failed',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Edit message request failed',
      options: {
        severity: 'error',
        tags: ['target:channel'],
        type: 'api:message:edit:failed',
      },
      origin: { emitter: 'MessageComposer' },
    });
  });

  it('constructs type from incident when type is not provided', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'ShareLocationDialog',
      incident: {
        domain: 'api',
        entity: 'location',
        operation: 'share',
      },
      message: 'Failed to share location',
      severity: 'error',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Failed to share location',
      options: {
        severity: 'error',
        tags: ['target:channel'],
        type: 'api:location:share:failed',
      },
      origin: { emitter: 'ShareLocationDialog' },
    });
  });

  it('prefers explicit type over incident-derived type', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'ShareLocationDialog',
      incident: {
        domain: 'api',
        entity: 'location',
        operation: 'share',
      },
      message: 'Failed to share location',
      severity: 'error',
      type: 'custom:type',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Failed to share location',
      options: {
        severity: 'error',
        tags: ['target:channel'],
        type: 'custom:type',
      },
      origin: { emitter: 'ShareLocationDialog' },
    });
  });

  it('uses incident.status when provided', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'ShareLocationDialog',
      incident: {
        domain: 'api',
        entity: 'location',
        operation: 'share',
        status: 'blocked',
      },
      message: 'Location sharing blocked',
      severity: 'error',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Location sharing blocked',
      options: {
        severity: 'error',
        tags: ['target:channel'],
        type: 'api:location:share:blocked',
      },
      origin: { emitter: 'ShareLocationDialog' },
    });
  });

  it('falls back to severity as status for incident type when severity is non-error/success', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'Uploader',
      incident: {
        domain: 'api',
        entity: 'attachment',
        operation: 'upload',
      },
      message: 'Uploading attachment',
      severity: 'loading',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Uploading attachment',
      options: {
        severity: 'loading',
        tags: ['target:channel'],
        type: 'api:attachment:upload:loading',
      },
      origin: { emitter: 'Uploader' },
    });
  });
});
