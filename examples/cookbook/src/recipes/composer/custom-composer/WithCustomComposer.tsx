import type { PropsWithChildren } from 'react';
import { WithComponents } from 'stream-chat-react';
import { CustomMessageComposer } from './CustomMessageComposer';

// Declared once, so WithComponents gets the same object on every render.
const overrides = { MessageComposerUI: CustomMessageComposer };

export const WithCustomComposer = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
