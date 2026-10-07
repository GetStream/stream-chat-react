import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react';
import type { UserResponse } from 'stream-chat';
import {
  Avatar,
  IconCamera,
  IconLoading,
  IconXmark,
  Prompt,
  SwitchField,
  TextInput,
  useChatContext,
  useWorkspaceNavigation,
} from 'stream-chat-react';

import { SearchableSelect } from '../AppSettings/SearchableSelect';
import { createGroup, openOneToOne } from './createConversation';

const SEARCH_DEBOUNCE_MS = 250;

/** Users matching `query` by id or name, without the connected user. */
const useUserSearch = (query: string) => {
  const { client } = useChatContext();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const text = query.trim();
    if (!text) {
      setUsers([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await client.queryUsers({
          payload: {
            filter_conditions: {
              $or: [{ id: { $autocomplete: text } }, { name: { $autocomplete: text } }],
              id: { $ne: client.userID as string },
            },
            limit: 10,
            sort: [{ direction: 1, field: 'id' }],
          },
        });
        if (!cancelled) setUsers(response.users);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [client, query]);

  return { searching, users };
};

const displayName = (user: UserResponse) => user.name || user.id;

const optionLabel = (user: UserResponse) =>
  user.name && user.name !== user.id ? `${user.name} (${user.id})` : user.id;

const ImagePicker = ({
  image,
  name,
  onChange,
}: {
  image?: string;
  name: string;
  onChange: (image?: string) => void;
}) => {
  const { client } = useChatContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();

  const onFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // cleared, so choosing the same file again still fires `change`
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(undefined);
    try {
      const { file: url } = await client.uploadImage({ file });
      if (!url) throw new Error('The upload returned no image URL.');
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='app__new-conversation__image'>
      <button
        aria-label='Choose an image'
        className='app__new-conversation__image-button'
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        type='button'
      >
        <Avatar imageUrl={image} size='xl' userName={name || '?'} />
        <span aria-hidden className='app__new-conversation__image-overlay'>
          {uploading ? <IconLoading /> : <IconCamera />}
        </span>
      </button>
      <input
        accept='image/*'
        hidden
        onChange={onFileSelected}
        ref={inputRef}
        type='file'
      />
      {image && (
        <button
          className='app__new-conversation__link-button'
          onClick={() => onChange(undefined)}
          type='button'
        >
          Remove image
        </button>
      )}
      {error && <div className='app__new-conversation__error'>{error}</div>}
    </div>
  );
};

/**
 * Starts a conversation: pick the members, optionally name it and give it an image. One other member
 * opens the 1:1 conversation with them, the existing one if there is one; a new 1:1 is created on the
 * server when its first message is sent. More members create a new group on the server right away.
 */
export const NewConversationDialog = ({ onClose }: { onClose: () => void }) => {
  const { client } = useChatContext();
  const { openChannel } = useWorkspaceNavigation();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<UserResponse[]>([]);
  const [name, setName] = useState('');
  const [image, setImage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [lookUpExisting, setLookUpExisting] = useState(true);
  const [error, setError] = useState<string>();
  const { searching, users } = useUserSearch(query);

  const isOneToOne = selected.length === 1;
  // the connected user, who creates the conversation and is always one of its members
  const me = client.user as UserResponse | undefined;
  const selectedIds = new Set(selected.map(({ id }) => id));
  const candidates = users.filter(({ id }) => !selectedIds.has(id));

  const add = (userId: string) => {
    const user = users.find(({ id }) => id === userId);
    if (user) setSelected((current) => [...current, user]);
  };
  const remove = (userId: string) =>
    setSelected((current) => current.filter(({ id }) => id !== userId));

  const searchStatus = !query.trim()
    ? 'Type a name or id'
    : searching
      ? 'Searching…'
      : `No one else matches “${query.trim()}”`;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected.length) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const details = { image, name };
      const { channel, existed } = isOneToOne
        ? await openOneToOne(client, selected[0], details, { lookUpExisting })
        : await createGroup(client, selected, details);
      if (existed && (name.trim() || image)) {
        client.notifications.addInfo({
          message:
            'This conversation already exists, so its name and image were left unchanged.',
          origin: { emitter: 'NewConversationDialog' },
        });
      }
      openChannel(channel);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  };

  return (
    <Prompt.Root className='app__new-conversation'>
      <Prompt.Header close={onClose} title='New conversation' />
      <form className='app__new-conversation__form' onSubmit={submit}>
        <Prompt.Body className='app__new-conversation__body'>
          <div className='app__new-conversation__details'>
            <ImagePicker image={image} name={name} onChange={setImage} />
            <TextInput
              aria-label='Conversation name'
              onChange={(event) => setName(event.target.value)}
              placeholder={isOneToOne ? 'Name (optional)' : 'Group name (optional)'}
              value={name}
            />
          </div>

          <div className='app__new-conversation__members'>
            <SearchableSelect<string>
              emptyLabel='Add people'
              emptyOptionsLabel={searchStatus}
              filterOptions={false}
              onChange={add}
              onSearchChange={setQuery}
              options={candidates.map((user) => ({
                label: optionLabel(user),
                value: user.id,
              }))}
              searchPlaceholder='Search people by name or id'
              value=''
            />

            <ul aria-label='Members' className='app__new-conversation__chips'>
              {me && (
                <li className='app__new-conversation__chip'>
                  <Avatar imageUrl={me.image} size='xs' userName={displayName(me)} />
                  <span>{displayName(me)} (you)</span>
                </li>
              )}
              {selected.length ? (
                selected.map((user) => (
                  <li className='app__new-conversation__chip' key={user.id}>
                    <Avatar
                      imageUrl={user.image}
                      size='xs'
                      userName={displayName(user)}
                    />
                    <span>{displayName(user)}</span>
                    <button
                      aria-label={`Remove ${displayName(user)}`}
                      className='app__new-conversation__chip-remove'
                      onClick={() => remove(user.id)}
                      type='button'
                    >
                      <IconXmark />
                    </button>
                  </li>
                ))
              ) : (
                <li className='app__new-conversation__empty'>Add at least one person.</li>
              )}
            </ul>

            <p className='app__new-conversation__hint'>
              {!selected.length
                ? 'Add one person for a 1:1 conversation, or more for a group.'
                : isOneToOne
                  ? 'Opens your conversation with this person. If it is new, it is created when you send the first message, with this name and image.'
                  : 'Creates a new group with these members, name and image.'}
            </p>

            {isOneToOne && (
              <SwitchField
                checked={!lookUpExisting}
                id='new-conversation-skip-lookup-switch'
                onChange={(event) => setLookUpExisting(!event.target.checked)}
                title='Dev: open as a new local conversation even if one exists (tests the cid swap)'
              />
            )}
          </div>

          {error && <div className='app__new-conversation__error'>{error}</div>}
        </Prompt.Body>
        <Prompt.Footer>
          <Prompt.FooterControls>
            <Prompt.FooterControlsButtonSecondary onClick={onClose} type='button'>
              Cancel
            </Prompt.FooterControlsButtonSecondary>
            <Prompt.FooterControlsButtonPrimary
              disabled={!selected.length || submitting}
              type='submit'
            >
              {isOneToOne ? 'Open conversation' : 'Start group'}
            </Prompt.FooterControlsButtonPrimary>
          </Prompt.FooterControls>
        </Prompt.Footer>
      </form>
    </Prompt.Root>
  );
};
