import type { PropsWithChildren } from 'react';
import { WithComponents } from 'stream-chat-react';
import { AttachmentWithMaps } from './GeolocationWithMap';
import { ShareLocationDialogWithMap } from './ShareLocationDialogWithMap';
import './LocationColors.css';

// Declared once, so WithComponents gets the same object on every render.
const overrides = {
  Attachment: AttachmentWithMaps,
  ShareLocationDialog: ShareLocationDialogWithMap,
};

export const WithLocationMaps = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
