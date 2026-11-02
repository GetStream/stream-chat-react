import type { PollComposerState } from 'stream-chat';
import type { PollCreationDialogProps } from 'stream-chat-react';
import {
  Prompt,
  TextInput,
  useCanCreatePoll,
  useMessageComposerController,
  useStateStore,
} from 'stream-chat-react';
import './AddPollDialog.css';

const pollFieldsSelector = ({ data }: PollComposerState) => ({
  name: data.name,
  options: data.options,
});

/**
 * Creates the poll and adds it to the composer, without sending anything. The message goes out
 * when the user sends it from the composer. `AttachmentSelector` resets the form each time it opens
 * the dialog.
 */
export const AddPollDialog = ({ close }: PollCreationDialogProps) => {
  const messageComposer = useMessageComposerController();
  const { pollComposer } = messageComposer;
  const { name, options } = useStateStore(pollComposer.state, pollFieldsSelector);
  const canCreatePoll = useCanCreatePoll();

  const addPoll = async () => {
    close();
    try {
      // Creates the poll on the server and sets `messageComposer.state.pollId`, so a new poll
      // replaces one already waiting in the composer. The replaced poll stays on the server.
      await messageComposer.createPoll();
    } catch {
      // `createPoll()` already reported the failure as a notification.
    }
  };

  return (
    <Prompt.Root className='str-chat__poll-creation-dialog'>
      <Prompt.Header close={close} title='Create poll' />
      <Prompt.Body>
        <form
          autoComplete='off'
          className='cookbook-add-poll__form'
          onSubmit={(event) => {
            event.preventDefault();
            if (canCreatePoll) void addPoll();
          }}
        >
          <TextInput
            data-autofocus
            id='cookbook-add-poll-question'
            label='Question'
            onBlur={() => pollComposer.handleFieldBlur('name')}
            onChange={(event) =>
              pollComposer.updateFields({ data: { name: event.target.value } })
            }
            placeholder='Ask a question'
            value={name}
          />
          {/* The poll composer adds an empty option after the last filled one, and drops an
              emptied option that isn't the last. */}
          {options.map((option, index) => (
            <TextInput
              id={`cookbook-add-poll-option-${option.id}`}
              key={option.id}
              label={`Option ${index + 1}`}
              onChange={(event) =>
                pollComposer.updateFields({
                  data: { options: { index, text: event.target.value } },
                })
              }
              placeholder='Add an option'
              value={option.text}
            />
          ))}
        </form>
      </Prompt.Body>
      <Prompt.Footer>
        <Prompt.FooterControls>
          <Prompt.FooterControlsButtonSecondary onClick={close} type='button'>
            Cancel
          </Prompt.FooterControlsButtonSecondary>
          <Prompt.FooterControlsButtonPrimary
            disabled={!canCreatePoll}
            onClick={() => void addPoll()}
            type='button'
          >
            Add to message
          </Prompt.FooterControlsButtonPrimary>
        </Prompt.FooterControls>
      </Prompt.Footer>
    </Prompt.Root>
  );
};
