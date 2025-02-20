import type { DraftResponse, StreamChat } from 'stream-chat';

export const dispatchDraftDeleted = ({
  client,
  draft,
}: {
  client: StreamChat;
  draft: DraftResponse;
}) => {
  client.dispatchEvent({
    type: 'draft.deleted',
    created_at: new Date().toISOString(),
    cid: draft.channel_cid,
    draft,
  });
};
