import type { PropsWithChildren } from 'react';
import type { AttachmentProps } from 'stream-chat-react';
import { Attachment, WithComponents } from 'stream-chat-react';
import { ImageGrid } from './ImageGrid';

// A message with several images or videos renders `ModalGallery` from this prop.
const AttachmentWithImageGrid = (props: AttachmentProps) => (
  <Attachment {...props} ModalGallery={ImageGrid} />
);

// Declared once, so WithComponents gets the same object on every render. A message with one image
// renders `Image`, which takes `ModalGallery` from here, not from the prop.
const overrides = { Attachment: AttachmentWithImageGrid, ModalGallery: ImageGrid };

export const WithImageGallery = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
