import type { PropsWithChildren } from 'react';
import type { AttachmentProps } from 'stream-chat-react';
import { Attachment, WithComponents } from 'stream-chat-react';
import { GiphyPreviewActions } from './GiphyPreviewActions';

// A Giphy preview's buttons render `AttachmentActions` from this prop.
const AttachmentWithGiphyPreview = (props: AttachmentProps) => (
  <Attachment {...props} AttachmentActions={GiphyPreviewActions} />
);

// Declared once, so WithComponents gets the same object on every render.
const overrides = { Attachment: AttachmentWithGiphyPreview };

export const WithGiphyPreview = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
