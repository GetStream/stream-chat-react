import type { PropsWithChildren } from 'react';
import type { AttachmentProps } from 'stream-chat-react';
import { Attachment, WithComponents } from 'stream-chat-react';
import { VoteAttachmentActions } from './VoteAttachmentActions';

export const VoteAttachment = (props: AttachmentProps) => (
  <Attachment {...props} AttachmentActions={VoteAttachmentActions} />
);

// Declared once, so WithComponents gets the same object on every render.
const overrides = { Attachment: VoteAttachment };

export const WithVoteAttachments = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
