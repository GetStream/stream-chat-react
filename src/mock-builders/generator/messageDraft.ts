import { generateMessage } from './message';
import type { DraftResponse } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

export const generateMessageDraft = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel_cid,
  ...customMsgDraft
}: Partial<DraftResponse<StreamChatGenerics>>) =>
  ({
    channel_cid,
    created_at: new Date().toISOString(),
    message: generateMessage(),
    ...customMsgDraft,
  }) as DraftResponse<StreamChatGenerics>;
