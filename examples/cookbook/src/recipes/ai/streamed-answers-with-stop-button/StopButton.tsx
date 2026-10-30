import type { ComponentProps, MouseEvent } from 'react';
import { Button, useMessageComposerContext } from 'stream-chat-react';
import './StopButton.css';

/**
 * Fills the composer's `StopAIGenerationButton` slot, which shows in place of the send button
 * while the assistant answers. It gets a button's props, and its `onClick` calls
 * `Channel.stopAIResponse()`. The button goes away once the answer stops, so the focus moves to
 * the text field, where the user writes the next question.
 */
export const StopButton = ({ onClick }: ComponentProps<'button'>) => {
  const { textareaRef } = useMessageComposerContext();

  const stop = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    textareaRef.current?.focus();
  };

  return (
    <Button
      appearance='solid'
      aria-label='Stop the answer'
      circular
      className='cookbook-stop-button'
      onClick={stop}
      size='sm'
      type='button'
      variant='primary'
    >
      <span aria-hidden='true' className='cookbook-stop-button__icon' />
    </Button>
  );
};
