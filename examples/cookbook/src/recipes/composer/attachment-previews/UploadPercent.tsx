import type { PropsWithChildren } from 'react';
import type { ProgressIndicatorProps } from 'stream-chat-react';
import { WithComponents } from 'stream-chat-react';
import './UploadPercent.css';

const UploadPercent = ({ percent }: ProgressIndicatorProps) => (
  <span className='cookbook-upload-percent'>{Math.round(percent)}%</span>
);

const overrides = { ProgressIndicator: UploadPercent };

export const WithUploadPercent = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
