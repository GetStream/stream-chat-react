import { nowNs } from 'stream-chat';
import type { DraftResponse, StreamChat } from 'stream-chat';

export const dispatchDraftUpdated = ({
  client,
  draft,
}: {
  client: StreamChat;
  draft: DraftResponse;
}) => {
  client.dispatchEvent({
    cid: draft.channel_cid,
    created_at: nowNs(),
    custom: {},
    draft,
    type: 'draft.updated',
  });
};
