import type { PropsWithChildren } from 'react';
import { convertTimestampToDate } from 'stream-chat';
import {
  useChatContext,
  useMessageContext,
  useUserRole,
  WithComponents,
} from 'stream-chat-react';
import './PinnedByIndicator.css';

const PinnedByIndicator = () => {
  const { client } = useChatContext();
  const { handlePin, message } = useMessageContext();
  const { canPin } = useUserRole(message);

  if (!message.pinned) return null;

  const pinnedBy = message.pinned_by;
  const pinnedByName =
    pinnedBy?.id === client.user?.id
      ? 'you'
      : (pinnedBy?.name ?? pinnedBy?.id ?? 'someone');
  const pinnedAt = convertTimestampToDate(message.pinned_at);
  const expiresAt = convertTimestampToDate(message.pin_expires);

  return (
    <div className='str-chat__message-pin-indicator cookbook-pinned-by'>
      <span>
        <span aria-hidden>📌</span> Pinned by {pinnedByName}
        {pinnedAt && ` on ${pinnedAt.toLocaleDateString()}`}
      </span>
      {expiresAt && (
        <span className='cookbook-pinned-by__expiry'>
          until {expiresAt.toLocaleString()}
        </span>
      )}
      {canPin && (
        <button className='cookbook-pinned-by__unpin' onClick={handlePin} type='button'>
          Unpin
        </button>
      )}
    </div>
  );
};

// Declared once, so WithComponents gets the same object on every render.
const overrides = { PinIndicator: PinnedByIndicator };

export const WithPinnedByIndicator = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
