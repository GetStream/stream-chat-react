import type { PropsWithChildren } from 'react';
import { WithComponents } from 'stream-chat-react';
import { GifAttachmentPreviewList } from './GifAttachmentPreview';
import { ComposerActionsWithGifButton } from './GifButton';

// Declared once, so WithComponents gets the same object on every render.
const overrides = {
  AdditionalMessageComposerActions: ComposerActionsWithGifButton,
  AttachmentPreviewList: GifAttachmentPreviewList,
};

export const WithGifPicker = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
