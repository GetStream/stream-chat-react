import React, { useMemo } from 'react';

/** Three skeleton rows, each an avatar and a line, while the reacting users load. */
export const MessageReactionsDetailLoadingIndicator = () => {
  const elements = useMemo(
    () =>
      Array.from({ length: 3 }, (_, index) => (
        <div className='str-chat__message-reactions-detail__skeleton-item' key={index}>
          <div className='str-chat__message-reactions-detail__skeleton-avatar' />
          <div className='str-chat__message-reactions-detail__skeleton-line' />
        </div>
      )),
    [],
  );

  return <>{elements}</>;
};
