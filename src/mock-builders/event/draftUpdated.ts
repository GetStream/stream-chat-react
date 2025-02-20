import type { DraftResponse, StreamChat } from 'stream-chat';

export const dispatchDraftUpdated = ({
  client,
  draft,
}: {
  client: StreamChat;
  draft: DraftResponse;
}) => {
  client.dispatchEvent({
    type: 'draft.updated',
    created_at: new Date().toISOString(),
    cid: draft.channel_cid,
    draft,
  });
};
