import { generateMessage } from './message';
import type { DraftResponse } from 'stream-chat';
import { convertDateToTimestamp } from './time';

export const generateMessageDraft = ({
  channel_cid,
  ...customMsgDraft
}: Partial<DraftResponse>) =>
  ({
    channel_cid,
    created_at: convertDateToTimestamp(),
    message: generateMessage(),
    ...customMsgDraft,
  }) as DraftResponse;
