import type { PropsWithChildren } from 'react';
import { WithComponents } from 'stream-chat-react';
import { CustomMessageUi } from './CustomMessageUi';

// Declared once, so WithComponents gets the same object on every render.
const overrides = { MessageUI: CustomMessageUi };

export const WithCustomMessageUi = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
