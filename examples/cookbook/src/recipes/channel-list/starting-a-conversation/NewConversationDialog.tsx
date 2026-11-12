import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import type { UserResponse } from 'stream-chat';
import { Prompt, useChatContext, useWorkspaceNavigation } from 'stream-chat-react';
import { PeoplePicker } from './PeoplePicker';
import { findDirectConversation, startLocalConversation } from './startConversation';
import './NewConversationDialog.css';

/**
 * Names the conversation, picks the people to talk to and opens the conversation with them: the
 * user's existing direct conversation for one person, otherwise a new conversation that's created,
 * with its name, on its first message.
 */
export const NewConversationDialog = ({ onClose }: { onClose: () => void }) => {
  const { channelManager, client } = useChatContext();
  const { openChannel } = useWorkspaceNavigation();
  const [selected, setSelected] = useState<UserResponse[]>([]);
  const [name, setName] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string>();
  const id = useId();

  const isGroup = selected.length > 1;

  const start = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected.length) return;
    setIsOpening(true);
    setError(undefined);
    try {
      const existing =
        selected.length === 1
          ? await findDirectConversation(client, selected[0].id)
          : undefined;
      if (existing) channelManager.ingestChannel(existing);
      const channel = existing ?? startLocalConversation(client, selected, name.trim());
      // A conversation that already exists keeps its own name, so the user learns why the typed
      // one isn't shown. The notification shows in the channel panel, where the conversation opens.
      if (!channel.isProvisional && name.trim()) {
        client.notifications.addInfo({
          message: 'This conversation already exists, so its name was left unchanged.',
          origin: { emitter: 'NewConversationDialog' },
        });
      }
      openChannel(channel);
      onClose();
    } catch {
      setError("Couldn't open the conversation. Try again.");
      setIsOpening(false);
    }
  };

  return (
    <Prompt.Root className='cookbook-new-conversation'>
      <Prompt.Header close={onClose} title='New conversation' />
      <form className='cookbook-new-conversation__form' onSubmit={start}>
        <Prompt.Body className='cookbook-new-conversation__body'>
          <label className='cookbook-new-conversation__label' htmlFor={`${id}-name`}>
            {isGroup ? 'Group name (optional)' : 'Name (optional)'}
          </label>
          {/* The conversation's name, not the user's, so the browser doesn't offer to fill it. */}
          <input
            autoComplete='off'
            className='cookbook-new-conversation__input'
            id={`${id}-name`}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
          <PeoplePicker onChange={setSelected} selected={selected} />
          {error && (
            <p className='cookbook-new-conversation__error' role='alert'>
              {error}
            </p>
          )}
        </Prompt.Body>
        <Prompt.Footer>
          <Prompt.FooterControls>
            <Prompt.FooterControlsButtonSecondary onClick={onClose} type='button'>
              Cancel
            </Prompt.FooterControlsButtonSecondary>
            <Prompt.FooterControlsButtonPrimary
              disabled={!selected.length || isOpening}
              type='submit'
            >
              Start conversation
            </Prompt.FooterControlsButtonPrimary>
          </Prompt.FooterControls>
        </Prompt.Footer>
      </form>
    </Prompt.Root>
  );
};
