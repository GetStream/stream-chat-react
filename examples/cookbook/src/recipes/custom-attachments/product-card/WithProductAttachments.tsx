import type { PropsWithChildren } from 'react';
import { WithComponents } from 'stream-chat-react';
import { ProductAttachmentPreviewList } from './ProductAttachmentPreview';
import { ProductAttachment } from './ProductCard';
import { ProductMessagePreview } from './ProductMessagePreview';
import { ProductAttachmentSelector } from './ProductPicker';
import {
  ProductQuotedMessage,
  ProductQuotedMessagePreview,
} from './ProductQuotedMessage';

// Declared once, so WithComponents gets the same object on every render.
const overrides = {
  Attachment: ProductAttachment,
  AttachmentPreviewList: ProductAttachmentPreviewList,
  AttachmentSelector: ProductAttachmentSelector,
  QuotedMessage: ProductQuotedMessage,
  QuotedMessagePreview: ProductQuotedMessagePreview,
  SummarizedMessagePreview: ProductMessagePreview,
};

export const WithProductAttachments = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
