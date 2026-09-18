import { defaultMessageActionSet, SwitchField } from 'stream-chat-react';
import { appSettingsStore, useAppSettingsState } from '../../state';
import type { CustomMessageActionToggles, MessageActionSurface } from '../../state';
import {
  SettingsTabBody,
  SettingsTabLayoutHeader,
} from '../SettingsTabLayoutComponents.tsx';

type MessageActionsTabProps = {
  close: () => void;
};

const SURFACES: { label: string; surface: MessageActionSurface }[] = [
  { label: 'Channel message list', surface: 'channel' },
  { label: 'Thread message list', surface: 'thread' },
];

/**
 * One row of the matrix: an action, and what toggling it means for a single surface's settings.
 *
 * `read`/`write` rather than a key, because the toggles are not uniformly shaped -- a default
 * action is an entry in a disabled list, while the demo-app switches are booleans or nested flags.
 */
type ActionRow = {
  comment?: React.ReactNode;
  id: string;
  label: string;
  /** Surfaces where the SDK drops this action regardless of the setting, so the switch is inert. */
  inertOn?: MessageActionSurface[];
  read: (toggles: CustomMessageActionToggles) => boolean;
  write: (
    toggles: CustomMessageActionToggles,
    value: boolean,
  ) => CustomMessageActionToggles;
};

// Read off the set the SDK ships rather than hard-coded, so an action added there shows up here
// without anyone remembering to list it. The set holds one entry per placement, hence the de-dupe.
const DEFAULT_ACTION_TYPES = [
  ...new Set(
    defaultMessageActionSet.flatMap((item) => ('type' in item ? [item.type] : [])),
  ),
].sort();

// `useBaseMessageActionSetFilter` drops these for a thread reply, and drops everything for the
// thread's parent message -- so every message a thread list renders is one or the other, and the
// setting can never show them there.
const INERT_IN_THREAD = ['pin', 'reply', 'markUnread'];

/** `markUnread` -> `Mark unread`. */
const humanizeActionType = (type: string) => {
  const spaced = type.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

// Stored as what is turned *off*, so switching one on is removing it from the list.
const DEFAULT_ACTION_ROWS: ActionRow[] = DEFAULT_ACTION_TYPES.map((type) => ({
  comment: INERT_IN_THREAD.includes(type)
    ? 'The SDK does not offer this action on thread replies.'
    : undefined,
  id: `default-${type}`,
  inertOn: INERT_IN_THREAD.includes(type)
    ? (['thread'] as MessageActionSurface[])
    : undefined,
  label: humanizeActionType(type),
  read: (toggles) => !toggles.disabledActionTypes.includes(type),
  write: (toggles, value) => ({
    ...toggles,
    disabledActionTypes: value
      ? toggles.disabledActionTypes.filter((disabled) => disabled !== type)
      : [...toggles.disabledActionTypes, type],
  }),
}));

const CUSTOM_ACTION_ROWS: ActionRow[] = [
  {
    comment: (
      <>
        Configure delete request params in the Delete Message Alert, like{' '}
        <strong>&ldquo;Delete only for me&rdquo;</strong> and{' '}
        <strong>&ldquo;Hard delete&rdquo;</strong>.
      </>
    ),
    id: 'delete-options',
    label: 'Delete message options',
    read: (toggles) => toggles.delete.enableOptionConfiguration,
    write: (toggles, value) => ({
      ...toggles,
      delete: { enableOptionConfiguration: value },
    }),
  },
  {
    comment: 'Mark own messages as unread too.',
    id: 'mark-own-unread',
    label: 'Mark as unread',
    read: (toggles) => toggles.markOwnUnread,
    write: (toggles, value) => ({ ...toggles, markOwnUnread: value }),
  },
  {
    comment: 'Show the JSON viewer action in the message actions menu.',
    id: 'view-message-info',
    label: 'View message info',
    read: (toggles) => toggles.viewMessageInfo,
    write: (toggles, value) => ({ ...toggles, viewMessageInfo: value }),
  },
];

export const MessageActionsTab = ({ close }: MessageActionsTabProps) => {
  const {
    messageActions,
    messageActions: { customMessageActions },
  } = useAppSettingsState();

  const setToggles = (surface: MessageActionSurface, next: CustomMessageActionToggles) =>
    appSettingsStore.partialNext({
      messageActions: {
        ...messageActions,
        customMessageActions: { ...customMessageActions, [surface]: next },
      },
    });

  const renderRows = (rows: ActionRow[]) =>
    rows.map(({ comment, id, inertOn, label, read, write }) => (
      <tr key={id}>
        <th scope='row'>
          <div className='app__settings-modal__matrix__row-label'>{label}</div>
          {comment && <div className='app__settings-modal__field-comment'>{comment}</div>}
        </th>
        {SURFACES.map(({ label: surfaceLabel, surface }) => {
          const inert = inertOn?.includes(surface);

          return (
            <td key={surface}>
              <SwitchField
                // Named explicitly: the visible label is the row header, which a checkbox does not
                // inherit.
                aria-label={`${label} — ${surfaceLabel}`}
                checked={read(customMessageActions[surface]) && !inert}
                disabled={inert}
                id={`${surface}-${id}-switch`}
                onChange={(event) =>
                  setToggles(
                    surface,
                    write(customMessageActions[surface], event.target.checked),
                  )
                }
              />
            </td>
          );
        })}
      </tr>
    ));

  return (
    <div className='app__settings-modal__content-stack'>
      <SettingsTabLayoutHeader
        close={close}
        description='Configure the message actions exposed by the demo app, per message list.'
        title='Message Actions'
      />

      <SettingsTabBody>
        {/* A real table: the two lists are read across, one action at a time, and row/column
            headers give each switch its context for assistive tech. */}
        <table className='app__settings-modal__matrix'>
          <thead>
            <tr>
              <th scope='col'>Action</th>
              {SURFACES.map(({ label, surface }) => (
                <th key={surface} scope='col'>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className='app__settings-modal__matrix__section'>
              <th colSpan={SURFACES.length + 1} scope='colgroup'>
                Default actions
              </th>
            </tr>
            {renderRows(DEFAULT_ACTION_ROWS)}
            <tr className='app__settings-modal__matrix__section'>
              <th colSpan={SURFACES.length + 1} scope='colgroup'>
                Demo-app customizations
              </th>
            </tr>
            {renderRows(CUSTOM_ACTION_ROWS)}
          </tbody>
        </table>
      </SettingsTabBody>
    </div>
  );
};
