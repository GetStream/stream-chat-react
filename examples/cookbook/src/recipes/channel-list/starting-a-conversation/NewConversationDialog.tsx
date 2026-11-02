import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { UserResponse } from 'stream-chat';
import {
  Avatar,
  IconXmark,
  Prompt,
  useChatContext,
  useWorkspaceNavigation,
} from 'stream-chat-react';
import { findDirectConversation, startLocalConversation } from './startConversation';
import { usePeopleSearch } from './usePeopleSearch';
import './NewConversationDialog.css';

const nameOf = (user: UserResponse) => user.name ?? user.id;

// The avatar repeats the name beside it, so it's hidden from assistive technology. Avatar renders
// role="button" by default, which a chip or a result mustn't announce.
const decorative = { 'aria-hidden': true, role: 'presentation' } as const;

/**
 * Names the conversation, picks the people to talk to and opens the conversation with them: the
 * user's existing direct conversation for one person, otherwise a new conversation that's created,
 * with its name, on its first message.
 */
export const NewConversationDialog = ({ onClose }: { onClose: () => void }) => {
  const { channelManager, client } = useChatContext();
  const { openChannel } = useWorkspaceNavigation();
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<UserResponse[]>([]);
  const [name, setName] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string>();
  const { failed, isLoading, people } = usePeopleSearch(text);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const selectedIds = new Set(selected.map((user) => user.id));
  const results: UserResponse[] = people.filter(
    (user: UserResponse) => !selectedIds.has(user.id),
  );
  const isGroup = selected.length > 1;

  // The picked result and a removed chip leave the list, so the focus goes back to the input.
  const add = (user: UserResponse) => {
    setSelected((current) => [...current, user]);
    setText('');
    inputRef.current?.focus();
  };
  const remove = (user: UserResponse) => {
    setSelected((current) => current.filter(({ id }) => id !== user.id));
    inputRef.current?.focus();
  };

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
          {!!selected.length && (
            <ul aria-label='Selected people' className='cookbook-new-conversation__chips'>
              {selected.map((user) => (
                <li className='cookbook-new-conversation__chip' key={user.id}>
                  <Avatar {...decorative} size='xs' userName={nameOf(user)} />
                  {nameOf(user)}
                  <button
                    aria-label={`Remove ${nameOf(user)}`}
                    className='cookbook-new-conversation__chip-remove'
                    onClick={() => remove(user)}
                    type='button'
                  >
                    <IconXmark />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <label className='cookbook-new-conversation__label' htmlFor={`${id}-search`}>
            Add people
          </label>
          {/* The dialog's content mounts a render after the modal opens, so the input takes the
              focus itself. */}
          <input
            aria-controls={`${id}-results`}
            autoFocus
            className='cookbook-new-conversation__input'
            id={`${id}-search`}
            onChange={(event) => setText(event.target.value)}
            placeholder='Search by name'
            ref={inputRef}
            type='search'
            value={text}
          />
          <ul
            aria-busy={isLoading}
            aria-label='People'
            className='cookbook-new-conversation__results'
            id={`${id}-results`}
          >
            {results.map((user) => (
              <li className='cookbook-new-conversation__result' key={user.id}>
                <button
                  className='cookbook-new-conversation__result-button'
                  onClick={() => add(user)}
                  type='button'
                >
                  <Avatar {...decorative} size='md' userName={nameOf(user)} />
                  {nameOf(user)}
                </button>
              </li>
            ))}
          </ul>
          {!results.length && (
            <p className='cookbook-new-conversation__status' role='status'>
              {isLoading ? 'Searching…' : failed ? 'The search failed.' : 'No one found'}
            </p>
          )}
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
