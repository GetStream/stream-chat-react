import { act, renderHook } from '@testing-library/react';

import { useSubmitHandler } from '../useSubmitHandler';

const submitMocks = vi.hoisted(() => {
  const stateApi = () => ({
    getLatestValue: () => ({}),
    next: vi.fn(),
    partialNext: vi.fn(),
  });
  const messageComposerMock = {
    attachmentManager: { state: stateApi() },
    channel: { cid: 'messaging:test', stopTyping: vi.fn().mockResolvedValue(undefined) },
    clear: vi.fn(),
    compose: vi.fn(),
    config: { text: { publishTypingEvents: false } },
    customDataManager: { state: stateApi() },
    editedMessage: undefined as unknown,
    linkPreviewsManager: { state: stateApi() },
    pollComposer: { state: stateApi() },
    state: stateApi(),
    textComposer: { state: stateApi() },
  };
  return {
    addNotification: vi.fn(),
    editMessage: vi.fn(),
    messageComposerMock,
    sendMessage: vi.fn(),
  };
});

vi.mock('../../../Notifications', () => ({
  useNotificationApi: () => ({
    addNotification: submitMocks.addNotification,
    addSystemNotification: vi.fn(),
    removeNotification: vi.fn(),
    startNotificationTimeout: vi.fn(),
  }),
}));

vi.mock('../../../../context/ChannelActionContext', () => ({
  useChannelActionContext: () => ({
    editMessage: submitMocks.editMessage,
    sendMessage: submitMocks.sendMessage,
  }),
}));

vi.mock('../../../../context/TranslationContext', () => ({
  useTranslationContext: () => ({ t: (k: string) => k }),
}));

vi.mock('../useMessageComposerController', () => ({
  useMessageComposerController: () => submitMocks.messageComposerMock,
}));

describe('useSubmitHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    submitMocks.messageComposerMock.editedMessage = undefined;
    vi.spyOn(submitMocks.messageComposerMock, 'compose')
      .mockImplementation()
      .mockResolvedValue({
        localMessage: { id: 'lm1', type: 'regular' },
        message: { id: 'm1', text: 'hi' },
        sendOptions: {},
      });
  });

  it('notifies when editMessage fails', async () => {
    submitMocks.messageComposerMock.editedMessage = { id: 'e1' };
    submitMocks.editMessage.mockRejectedValueOnce(new Error('edit failed'));

    const { result } = renderHook(() => useSubmitHandler({}));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(submitMocks.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Edit message request failed',
        severity: 'error',
      }),
    );
  });

  it('restores composer state and notifies when sendMessage fails', async () => {
    submitMocks.sendMessage.mockRejectedValueOnce(new Error('send failed'));

    const { result } = renderHook(() => useSubmitHandler({}));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(submitMocks.messageComposerMock.state.next).toHaveBeenCalled();
    expect(submitMocks.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Send message request failed',
        severity: 'error',
      }),
    );
  });
});
