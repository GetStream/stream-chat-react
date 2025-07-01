import type { DraftResponse, StreamChat } from 'stream-chat';

export const dispatchDraftDeleted = ({
  client,
  draft,
}: {
  client: StreamChat;
  draft: DraftResponse;
}) => {
  client.dispatchEvent({
    cid: draft.channel_cid,
    created_at: new Date().toISOString(),
    draft,
    type: 'draft.deleted',
  });
};
