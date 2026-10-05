import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useRef,
  useState,
} from 'react';
import {
  Avatar,
  Button,
  IconCamera,
  IconCheckmark,
  IconDelete,
  IconEdit,
  IconLoading,
  IconPlus,
  IconXmark,
  Prompt,
  TextInput,
  useChatContext,
} from 'stream-chat-react';

import { type ProfileUser, toProfileUser } from './useOwnUser';

/**
 * Fields the API keeps outside `custom`. A custom property can't take one of these names: the
 * server would write the built-in field (or reject the update) instead.
 */
const RESERVED_KEYS = new Set([
  'banned',
  'created_at',
  'custom',
  'deactivated_at',
  'deleted_at',
  'id',
  'image',
  'invisible',
  'language',
  'last_active',
  'name',
  'online',
  'privacy_settings',
  'revoke_tokens_issued_before',
  'role',
  'teams',
  'teams_role',
  'updated_at',
]);

/** Shown as typed for text; other JSON values (numbers, booleans, objects) as JSON. */
const formatValue = (value: unknown) =>
  typeof value === 'string' ? value : JSON.stringify(value);

/** Text that is valid JSON for a non-string value is stored as that value; anything else as text. */
const parseValue = (text: string): unknown => {
  try {
    const parsed: unknown = JSON.parse(text);
    return typeof parsed === 'string' ? text : parsed;
  } catch {
    return text;
  }
};

type FieldRowProps = {
  label: string;
  onRemove?: () => Promise<void>;
  onSave?: (text: string) => Promise<void>;
  placeholder?: string;
  value: string;
};

const FieldRow = ({ label, onRemove, onSave, placeholder, value }: FieldRowProps) => {
  const [draft, setDraft] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const editing = draft !== undefined;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(undefined);
    try {
      await action();
      setDraft(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!onSave || draft === undefined) return;
    if (draft === value) return setDraft(undefined);
    void run(() => onSave(draft));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') save();
    if (event.key === 'Escape') {
      event.stopPropagation();
      setDraft(undefined);
      setError(undefined);
    }
  };

  return (
    <div className='app__user-profile__field'>
      <div className='app__user-profile__field-label'>{label}</div>
      {editing ? (
        <TextInput
          aria-label={label}
          autoFocus
          disabled={busy}
          errorMessage={error}
          onChange={(event) => setDraft(event.target.value)}
          // the whole value is selected, so typing replaces it
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          trailing={
            <>
              <Button
                appearance='ghost'
                aria-label={`Save ${label}`}
                circular
                disabled={busy}
                onClick={save}
                size='sm'
                variant='secondary'
              >
                <IconCheckmark />
              </Button>
              <Button
                appearance='ghost'
                aria-label={`Cancel editing ${label}`}
                circular
                disabled={busy}
                onClick={() => {
                  setDraft(undefined);
                  setError(undefined);
                }}
                size='sm'
                variant='secondary'
              >
                <IconXmark />
              </Button>
            </>
          }
          value={draft}
          variant='outline'
        />
      ) : (
        <div className='app__user-profile__field-value-row'>
          <div className='app__user-profile__field-value' title={value || undefined}>
            {value || <span className='app__user-profile__field-empty'>Not set</span>}
          </div>
          {onSave && (
            <Button
              appearance='ghost'
              aria-label={`Edit ${label}`}
              circular
              disabled={busy}
              onClick={() => setDraft(value)}
              size='sm'
              variant='secondary'
            >
              <IconEdit />
            </Button>
          )}
          {onRemove && (
            <Button
              appearance='ghost'
              aria-label={`Remove ${label}`}
              circular
              disabled={busy}
              onClick={() => void run(onRemove)}
              size='sm'
              variant='secondary'
            >
              <IconDelete />
            </Button>
          )}
        </div>
      )}
      {!editing && error && <div className='app__user-profile__error'>{error}</div>}
    </div>
  );
};

const AddCustomProperty = ({
  existingKeys,
  onAdd,
}: {
  existingKeys: string[];
  onAdd: (key: string, value: unknown) => Promise<void>;
}) => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const trimmedKey = key.trim();
  const keyError = !trimmedKey
    ? undefined
    : RESERVED_KEYS.has(trimmedKey)
      ? `"${trimmedKey}" is a built-in field`
      : existingKeys.includes(trimmedKey)
        ? `"${trimmedKey}" already exists; edit it above`
        : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!trimmedKey || keyError) return;
    setBusy(true);
    setError(undefined);
    try {
      await onAdd(trimmedKey, parseValue(value));
      setKey('');
      setValue('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className='app__user-profile__add' onSubmit={submit}>
      <div className='app__user-profile__section-title'>Add custom property</div>
      <div className='app__user-profile__add-inputs'>
        <TextInput
          aria-label='Property name'
          disabled={busy}
          error={!!keyError}
          onChange={(event) => setKey(event.target.value)}
          placeholder='Name, e.g. nickname'
          value={key}
          variant='outline'
        />
        <TextInput
          aria-label='Property value'
          disabled={busy}
          onChange={(event) => setValue(event.target.value)}
          placeholder='Value'
          value={value}
          variant='outline'
        />
        <Button
          appearance='solid'
          aria-label='Add custom property'
          disabled={busy || !trimmedKey || !!keyError}
          size='md'
          type='submit'
          variant='primary'
        >
          <IconPlus />
          Add
        </Button>
      </div>
      {(keyError || error) && (
        <div className='app__user-profile__error'>{keyError ?? error}</div>
      )}
      <div className='app__user-profile__hint'>
        Values that are valid JSON (numbers, booleans, objects) are stored as such;
        anything else as text.
      </div>
    </form>
  );
};

/**
 * The user's avatar as a button: clicking it opens the OS file picker, and the chosen image is
 * uploaded to the Stream CDN (`client.uploadImage()`) and its URL saved as the user's `image`.
 */
const AvatarPicker = ({
  onImageChange,
  user,
}: {
  onImageChange: (image: string | undefined) => Promise<void>;
  user: ProfileUser;
}) => {
  const { client } = useChatContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(undefined);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // cleared, so choosing the same file again still fires `change`
    event.target.value = '';
    if (!file) return;
    void run(async () => {
      const { file: url } = await client.uploadImage({ file });
      if (!url) throw new Error('The upload returned no image URL.');
      await onImageChange(url);
    });
  };

  return (
    <div className='app__user-profile__avatar-picker'>
      <button
        aria-label='Change profile image'
        className='app__user-profile__avatar-button'
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        type='button'
      >
        <Avatar imageUrl={user.image} size='2xl' userName={user.name || user.id} />
        <span aria-hidden className='app__user-profile__avatar-overlay'>
          {busy ? <IconLoading /> : <IconCamera />}
        </span>
      </button>
      <input
        accept='image/*'
        hidden
        onChange={onFileSelected}
        ref={inputRef}
        type='file'
      />
      {user.image && (
        <Button
          appearance='ghost'
          disabled={busy}
          onClick={() => void run(() => onImageChange(undefined))}
          size='sm'
          variant='secondary'
        >
          Remove photo
        </Button>
      )}
      {error && <div className='app__user-profile__error'>{error}</div>}
    </div>
  );
};

/**
 * The connected user's profile: the avatar (click to upload a new image), the name, the custom
 * properties, and a form to add one. Every change is saved right away with `client.updateUsersPartial()` under the user's own
 * token, which lets a user edit their own name, image and custom data; built-in fields such as
 * `role` need a server-side client, so they are shown read-only.
 */
export const UserDetailDialog = ({
  onClose,
  onUserChange,
  user,
}: {
  onClose: () => void;
  onUserChange: (user: ProfileUser) => void;
  user: ProfileUser;
}) => {
  const { client } = useChatContext();

  const update = async ({
    set,
    unset,
  }: {
    set?: Record<string, unknown>;
    unset?: string[];
  }) => {
    const { users } = await client.updateUsersPartial({
      users: [{ id: user.id, set, unset }],
    });
    const updated = users[user.id];
    if (updated) onUserChange(toProfileUser(updated));
  };

  // by name: the server returns custom data in no stable order, so rows would move on every save
  const customEntries = Object.entries(user.custom).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <Prompt.Root className='app__user-profile'>
      <Prompt.Header close={onClose} title='Profile' />
      <Prompt.Body className='app__user-profile__body'>
        <div className='app__user-profile__header'>
          <AvatarPicker
            onImageChange={(image) =>
              image ? update({ set: { image } }) : update({ unset: ['image'] })
            }
            user={user}
          />
          <div className='app__user-profile__id'>{user.id}</div>
        </div>

        <div className='app__user-profile__section'>
          <FieldRow
            label='Name'
            onSave={(text) => update({ set: { name: text } })}
            placeholder='Display name'
            value={user.name ?? ''}
          />
          <FieldRow label='Role' value={user.role ?? ''} />
        </div>

        <div className='app__user-profile__section'>
          <div className='app__user-profile__section-title'>Custom properties</div>
          {customEntries.length ? (
            customEntries.map(([key, value]) => (
              <FieldRow
                key={key}
                label={key}
                onRemove={() => update({ unset: [key] })}
                onSave={(text) => update({ set: { [key]: parseValue(text) } })}
                value={formatValue(value)}
              />
            ))
          ) : (
            <div className='app__user-profile__field-empty'>
              No custom properties yet.
            </div>
          )}
        </div>

        <AddCustomProperty
          existingKeys={customEntries.map(([key]) => key)}
          onAdd={(key, value) => update({ set: { [key]: value } })}
        />
      </Prompt.Body>
    </Prompt.Root>
  );
};
