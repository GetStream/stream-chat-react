import type { DraftResponse, StreamChat } from 'stream-chat';
import { convertDateToTimestamp } from '../generator/time';

export const dispatchDraftUpdated = ({
  client,
  draft,
}: {
  client: StreamChat;
  draft: DraftResponse;
}) => {
  client.dispatchEvent({
    cid: draft.channel_cid,
    created_at: convertDateToTimestamp(),
    draft,
    type: 'draft.updated',
  });
};
