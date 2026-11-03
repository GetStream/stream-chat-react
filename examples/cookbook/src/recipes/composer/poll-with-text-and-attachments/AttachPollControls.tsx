import { useState } from 'react';
import { flushSync } from 'react-dom';
import type { PollCreationDialogControlsProps } from 'stream-chat-react';
import {
  Prompt,
  useCanCreatePoll,
  useMessageComposerContext,
  useMessageComposerController,
} from 'stream-chat-react';

/**
 * The Create poll dialog's footer. "Add to message" creates the poll and adds it to the composer,
 * without sending anything. The message goes out when the user sends it from the composer.
 */
export const AttachPollControls = ({ close }: PollCreationDialogControlsProps) => {
  const { textareaRef } = useMessageComposerContext();
  const messageComposer = useMessageComposerController();
  const canCreatePoll = useCanCreatePoll();

  const [isCreating, setIsCreating] = useState(false);

  const addPoll = async () => {
    setIsCreating(true);
    try {
      // Creates the poll on the server and sets `messageComposer.state.pollId`, so a new poll
      // replaces one already waiting in the composer.
      await messageComposer.createPoll();
    } catch {
      // `createPoll()` already reported the failure as a notification.
    } finally {
      setIsCreating(false);
      // Closed only once the poll is attached: a message sent from the composer while the poll
      // is still being created would go out without it. Closing and focusing the composer in one
      // step keeps focus from passing through the attachment button that opened the dialog.
      flushSync(() => close());
      textareaRef?.current?.focus();
    }
  };

  return (
    <Prompt.Footer>
      <Prompt.FooterControls>
        <Prompt.FooterControlsButtonSecondary onClick={close} type='button'>
          Cancel
        </Prompt.FooterControlsButtonSecondary>
        <Prompt.FooterControlsButtonPrimary
          disabled={!canCreatePoll || isCreating}
          onClick={() => void addPoll()}
          type='submit'
        >
          Add to message
        </Prompt.FooterControlsButtonPrimary>
      </Prompt.FooterControls>
    </Prompt.Footer>
  );
};
