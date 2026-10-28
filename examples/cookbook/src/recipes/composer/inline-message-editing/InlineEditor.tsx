import type { KeyboardEvent } from 'react';
import type { MessageComposer as MessageComposerController } from 'stream-chat';
import {
  MessageComposer,
  MessageComposerControllerProvider,
  useMessageComposerSubmitFn,
  WithComponents,
} from 'stream-chat-react';
import './InlineEditor.css';

// The editor stands where the message was, so the composer's "Edit Message" preview of it is left
// out.
const overrides = { EditedMessagePreview: () => null };

const InlineEditorFooter = ({ onCancel }: { onCancel: () => void }) => {
  // Saves the edit, as the composer's checkmark and the Enter key do.
  const submit = useMessageComposerSubmitFn();

  return (
    <div className='cookbook-inline-editor__footer'>
      <span className='cookbook-inline-editor__hint'>Esc to cancel · Enter to save</span>
      <button className='cookbook-inline-editor__button' onClick={onCancel} type='button'>
        Cancel
      </button>
      <button
        className='cookbook-inline-editor__button cookbook-inline-editor__button--save'
        onClick={() => void submit()}
        type='button'
      >
        Save
      </button>
    </div>
  );
};

export const InlineEditor = ({ composer }: { composer: MessageComposerController }) => {
  // Clearing the composer ends the edit and closes the editor.
  const cancel = composer.clear;

  // Runs before the textarea's own handler, so an open suggestion list or command takes Esc first.
  const handleKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return;
    const { command, suggestions } = composer.textComposer;
    if (command || suggestions) return;
    event.preventDefault();
    cancel();
  };

  return (
    <div className='cookbook-inline-editor' onKeyDownCapture={handleKeyDownCapture}>
      <MessageComposerControllerProvider messageComposerController={composer}>
        <WithComponents overrides={overrides}>
          <MessageComposer focus />
          <InlineEditorFooter onCancel={cancel} />
        </WithComponents>
      </MessageComposerControllerProvider>
    </div>
  );
};
