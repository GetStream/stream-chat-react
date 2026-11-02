import type { PropsWithChildren } from 'react';
import { AttachmentPreviewList, WithComponents } from 'stream-chat-react';
import { ImageAttachmentPreview } from './ImageAttachmentPreview';
import './ImageAttachmentPreview.css';

const CustomAttachmentPreviewList = () => (
  <AttachmentPreviewList ImageAttachmentPreview={ImageAttachmentPreview} />
);

// Declared once, so WithComponents gets the same object on every render.
const overrides = { AttachmentPreviewList: CustomAttachmentPreviewList };

export const WithSquareImagePreviews = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
