import React from 'react';
import type { Attachment, DefaultGenerics, ExtendableGenerics } from 'stream-chat';
import { useChatContext, useMessageContext } from '../../context';

export const Geolocation = <SCG extends ExtendableGenerics = DefaultGenerics>({
  attachment,
}: {
  attachment: Attachment<SCG>;
}) => {
  const { channel } = useChatContext();
  const { isMyMessage, message } = useMessageContext();

  const stoppedSharing = !!attachment.stopped_sharing;
  const expired: boolean =
    typeof attachment.end_time === 'string' &&
    Date.now() > new Date(attachment.end_time).getTime();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        paddingBlock: 15,
        paddingInline: 10,
        width: 'auto',
      }}
    >
      {attachment.type === 'live_location' &&
        !stoppedSharing &&
        !expired &&
        isMyMessage() && (
          <button
            onClick={() =>
              channel?.stopLiveLocationSharing({
                attachments: message.attachments,
                id: message.id,
                type: message.type,
              })
            }
          >
            Stop sharing
          </button>
        )}
      {/* TODO: {MAP} */}
      <span>
        lat: {attachment.latitude}, lng: {attachment.longitude}
      </span>
      {(stoppedSharing || expired) && (
        <span style={{ fontSize: 12 }}>Location sharing ended</span>
      )}
    </div>
  );
};
