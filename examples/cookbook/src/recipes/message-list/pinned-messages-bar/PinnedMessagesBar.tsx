import { useState } from 'react';
import type { LocalMessage, PaginatorState } from 'stream-chat';
import { useChannel, useStateStore } from 'stream-chat-react';
import './PinnedMessagesBar.css';

const pinnedItemsSelector = ({ items }: PaginatorState<LocalMessage>) => ({ items });

export const PinnedMessagesBar = () => {
  const channel = useChannel();
  const { items = [] } = useStateStore(
    channel.pinnedMessagesPaginator.state,
    pinnedItemsSelector,
  );
  // The pin the bar shows. Until the first click, and when that pin is gone, the most recent one.
  const [shownId, setShownId] = useState<string>();

  if (!items.length) return null;

  // `items` holds the oldest pin first, so the most recent pin is the last item.
  const shownIndex = items.findIndex((message) => message.id === shownId);
  const index = shownIndex === -1 ? items.length - 1 : shownIndex;
  const shown = items[index];

  const jumpToShownPin = () => {
    void channel.messagePaginator.jumpToMessage(shown.id);
    // Next, the pin before it; after the oldest, the most recent again.
    setShownId((items[index - 1] ?? items[items.length - 1]).id);
  };

  return (
    <button className='cookbook-pinned-bar' onClick={jumpToShownPin} type='button'>
      <span className='cookbook-pinned-bar__content'>
        <span className='cookbook-pinned-bar__title'>
          Pinned message{items.length > 1 && ` #${index + 1}`}
        </span>
        <span className='cookbook-pinned-bar__text'>
          {shown.user?.name ?? shown.user?.id}: {shown.text}
        </span>
      </span>
    </button>
  );
};
