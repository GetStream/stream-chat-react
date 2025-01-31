import React from 'react';
import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import {
  dispatchMessageNewEvent,
  generateMessage,
  generateUser,
  getTestClientWithUser,
} from '../../../../mock-builders';

import { useGiphyPreview } from '../VirtualizedMessageList';
import { ChatProvider } from '../../../../context';

const me = generateUser();
const otherUser = generateUser();

const ownGiphyMessage = generateMessage({ command: 'giphy', user: me });
const foreignGiphyMessage = generateMessage({ command: 'giphy', user: otherUser });
const ownNonGiphyMessage = generateMessage({ user: me });
const foreignNonGiphyMessage = generateMessage({ user: otherUser });

const render = ({ client, separateGiphyPreview }) => {
  const wrapper = ({ children }) => (
    <ChatProvider value={{ client }}>{children}</ChatProvider>
  );
  return renderHook(() => useGiphyPreview(separateGiphyPreview), { wrapper });
};
describe('useGiphyPreview', () => {
  it('does not expose setGiphyPreviewMessage function if separateGiphyPreview is disabled', async () => {
    const client = await getTestClientWithUser(me);
    const { result } = render({ client, separateGiphyPreview: false });
    expect(result.current.giphyPreviewMessage).toBeUndefined();
    expect(result.current.setGiphyPreviewMessage).toBeUndefined();
  });

  it('exposes setGiphyPreviewMessage function if separateGiphyPreview is enabled', async () => {
    const client = await getTestClientWithUser(me);
    const { result } = render({ client, separateGiphyPreview: true });
    expect(result.current.giphyPreviewMessage).toBeUndefined();
    expect(result.current.setGiphyPreviewMessage).toStrictEqual(expect.any(Function));
  });

  it('unsets giphy preview with new own giphy message when separateGiphyPreview is enabled', async () => {
    const client = await getTestClientWithUser(me);
    const { result } = render({ client, separateGiphyPreview: true });
    await act(() => {
      result.current.setGiphyPreviewMessage(ownGiphyMessage);
    });
    expect(result.current.giphyPreviewMessage.id).toBe(ownGiphyMessage.id);
    await act(() => {
      dispatchMessageNewEvent(client, ownGiphyMessage);
    });
    expect(result.current.giphyPreviewMessage).toBeUndefined();
  });

  it('does not unset giphy preview with new foreign giphy message when separateGiphyPreview is enabled', async () => {
    const client = await getTestClientWithUser(me);
    const { result } = render({ client, separateGiphyPreview: true });
    await act(() => {
      result.current.setGiphyPreviewMessage(ownGiphyMessage);
    });
    expect(result.current.giphyPreviewMessage.id).toBe(ownGiphyMessage.id);
    await act(() => {
      dispatchMessageNewEvent(client, foreignGiphyMessage);
    });
    expect(result.current.giphyPreviewMessage.id).toBe(ownGiphyMessage.id);
  });

  it('does not unset giphy preview with new own non-giphy message when separateGiphyPreview is enabled', async () => {
    const client = await getTestClientWithUser(me);
    const { result } = render({ client, separateGiphyPreview: true });
    await act(() => {
      result.current.setGiphyPreviewMessage(ownGiphyMessage);
    });
    expect(result.current.giphyPreviewMessage.id).toBe(ownGiphyMessage.id);
    await act(() => {
      dispatchMessageNewEvent(client, ownNonGiphyMessage);
    });
    expect(result.current.giphyPreviewMessage.id).toBe(ownGiphyMessage.id);
  });

  it('does not unset giphy preview with new foreign non-giphy message when separateGiphyPreview is enabled', async () => {
    const client = await getTestClientWithUser(me);
    const { result } = render({ client, separateGiphyPreview: true });
    await act(() => {
      result.current.setGiphyPreviewMessage(ownGiphyMessage);
    });
    expect(result.current.giphyPreviewMessage.id).toBe(ownGiphyMessage.id);
    await act(() => {
      dispatchMessageNewEvent(client, foreignNonGiphyMessage);
    });
    expect(result.current.giphyPreviewMessage.id).toBe(ownGiphyMessage.id);
  });
});
