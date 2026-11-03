import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { useChatContext, WithComponents } from 'stream-chat-react';
import { AttachPollControls } from './AttachPollControls';
import { MessageComposerPreviewsWithPoll } from './ComposerPollPreview';
import { installPollWithText } from './installPollWithText';

// Declared once, so WithComponents gets the same object on every render.
const overrides = {
  MessageComposerPreviews: MessageComposerPreviewsWithPoll,
  PollCreationDialogControls: AttachPollControls,
};

const PollWithTextSetup = () => {
  const { client } = useChatContext();
  useEffect(() => installPollWithText(client), [client]);
  return null;
};

export const WithPollWithText = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>
    <PollWithTextSetup />
    {children}
  </WithComponents>
);
