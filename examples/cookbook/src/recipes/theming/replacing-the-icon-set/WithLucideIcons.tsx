import type { PropsWithChildren } from 'react';
import { WithComponents } from 'stream-chat-react';
import { LucideFileIcon } from './LucideFileIcon';
import { lucideIcons } from './lucideIcons';
import './lucide-icons.css';

// Declared once, so WithComponents gets the same object on every render.
const overrides = { AttachmentFileIcon: LucideFileIcon, icons: lucideIcons };

export const WithLucideIcons = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
