import { nowNs } from 'stream-chat';
import { generateMessage } from './message';
import type { DraftResponse } from 'stream-chat';

export const generateMessageDraft = ({
  channel_cid,
  ...customMsgDraft
}: Partial<DraftResponse>) =>
  ({
    channel_cid,
    created_at: nowNs(),
    message: generateMessage(),
    ...customMsgDraft,
  }) as DraftResponse;
