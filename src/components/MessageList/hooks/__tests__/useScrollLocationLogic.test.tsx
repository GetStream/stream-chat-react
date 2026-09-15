import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { useScrollLocationLogic } from '../MessageList/useScrollLocationLogic';
import { ChatProvider } from '../../../../context/ChatContext';
import { getTestClientWithUser, mockChatContext } from '../../../../mock-builders';

import type { LocalMessage, StreamChat } from 'stream-chat';

/**
 * Regression cover for the viewport jumping to the newest message when a window the user had
 * jumped to (a search result deep in history) merges into the live head.
 *
 * The merge shows up here as `hasMoreNewer` flipping true -> false while messages are appended
 * below the loaded window. The user is reading where they jumped; nothing about that transition
 * asks for the viewport to move.
 */

let client: StreamChat;

const generateMessages = (length: number, offset = 0) =>
  Array.from({ length }, (_, index) =>
    fromPartial<LocalMessage>({ id: `${index + offset}`, user: { id: 'someone-else' } }),
  );

/** A scroll container sitting at the bottom of its currently loaded window. */
const createListElement = () => {
  const element = {
    clientHeight: 600,
    getBoundingClientRect: () => fromPartial<DOMRect>({ height: 600, width: 400 }),
    offsetHeight: 600,
    scrollBy: vi.fn(),
    scrollHeight: 16000,
    scrollTo: vi.fn(),
    scrollTop: 15400,
  };
  return element as unknown as HTMLElement & { scrollTo: ReturnType<typeof vi.fn> };
};

const renderScrollLogic = ({
  hasMoreNewer,
  listElement,
  messages,
}: {
  hasMoreNewer: boolean;
  listElement: HTMLElement;
  messages: LocalMessage[];
}) =>
  renderHook(
    (props: { hasMoreNewer: boolean; messages: LocalMessage[] }) =>
      useScrollLocationLogic({
        hasMoreNewer: props.hasMoreNewer,
        listElement,
        loadMoreScrollThreshold: 100,
        messages: props.messages,
        scrolledUpThreshold: 200,
      }),
    {
      initialProps: { hasMoreNewer, messages },
      wrapper: ({ children }: React.PropsWithChildren) => (
        <ChatProvider value={mockChatContext({ client })}>{children}</ChatProvider>
      ),
    },
  );

describe('useScrollLocationLogic', () => {
  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'alice' });
  });

  it('does not scroll to the newest message when a jumped-to window merges into the live head', () => {
    const listElement = createListElement();
    const loadedWindow = generateMessages(25);

    const { rerender, result } = renderScrollLogic({
      hasMoreNewer: true,
      listElement,
      messages: loadedWindow,
    });
    // The list reports its scroll position through onScroll; the manager reads it from there.
    act(() => result.current.onScroll(fromPartial({ target: listElement })));
    listElement.scrollTo.mockClear();

    // The newer page arrives below the loaded window and closes the gap to the live head.
    listElement.scrollHeight = 28500;
    rerender({
      hasMoreNewer: false,
      messages: loadedWindow.concat(generateMessages(25, 25)),
    });

    expect(listElement.scrollTo).not.toHaveBeenCalled();
  });

  it('still scrolls to the newest message when messages arrive at the live head', () => {
    const listElement = createListElement();
    const loadedWindow = generateMessages(25);

    const { rerender, result } = renderScrollLogic({
      hasMoreNewer: false,
      listElement,
      messages: loadedWindow,
    });
    act(() => result.current.onScroll(fromPartial({ target: listElement })));
    listElement.scrollTo.mockClear();

    // Already at the head and at the bottom: a newly received message should pin the view to it.
    listElement.scrollHeight = 17000;
    rerender({
      hasMoreNewer: false,
      messages: loadedWindow.concat(generateMessages(1, 25)),
    });

    expect(listElement.scrollTo).toHaveBeenCalled();
  });
});
