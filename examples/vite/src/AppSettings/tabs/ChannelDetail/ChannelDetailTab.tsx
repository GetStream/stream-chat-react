import { Button, SwitchField } from 'stream-chat-react';

import {
  appSettingsStore,
  type ChannelMembersHeaderActionForm,
  type ChannelMembersHeaderActionId,
  useAppSettingsState,
} from '../../state';
import { channelMembersHeaderActionLabels } from './channelDetailSettings';

const channelMembersHeaderActionIds: ChannelMembersHeaderActionId[] = [
  'addMembers',
  'removeMembers',
];

const channelMembersHeaderActionForms: ChannelMembersHeaderActionForm[] = [
  'quick',
  'menu',
];

const getChannelMembersHeaderActionFormLabel = (form: ChannelMembersHeaderActionForm) =>
  form === 'quick' ? 'Quick' : 'Menu';

export const ChannelDetailTab = () => {
  const {
    channelDetail,
    channelDetail: {
      modal: {
        channelMembersView: { headerActions },
      },
    },
  } = useAppSettingsState();

  const updateChannelMembersHeaderAction = (
    type: ChannelMembersHeaderActionId,
    update: Partial<(typeof headerActions)[ChannelMembersHeaderActionId]>,
  ) => {
    appSettingsStore.partialNext({
      channelDetail: {
        ...channelDetail,
        modal: {
          ...channelDetail.modal,
          channelMembersView: {
            ...channelDetail.modal.channelMembersView,
            headerActions: {
              ...headerActions,
              [type]: {
                ...headerActions[type],
                ...update,
              },
            },
          },
        },
      },
    });
  };

  return (
    <div className='app__settings-modal__content-stack'>
      <div className='app__settings-modal__field'>
        <div className='app__settings-modal__field-label'>
          Channel members view actions
        </div>
        <div className='app__settings-modal__field-comment'>
          Configure which default header actions are available in the ChannelDetail modal
          and how each action is rendered.
        </div>

        <div className='app__settings-modal__action-list'>
          {channelMembersHeaderActionIds.map((type) => {
            const action = headerActions[type];

            return (
              <div className='app__settings-modal__action-row' key={type}>
                <SwitchField
                  checked={action.enabled}
                  id={`channel-members-${type}-enabled-switch`}
                  onChange={(event) =>
                    updateChannelMembersHeaderAction(type, {
                      enabled: event.target.checked,
                    })
                  }
                >
                  {channelMembersHeaderActionLabels[type]}
                </SwitchField>

                <div
                  aria-label={`${channelMembersHeaderActionLabels[type]} form`}
                  className='app__settings-modal__options-row'
                  role='group'
                >
                  {channelMembersHeaderActionForms.map((form) => (
                    <Button
                      aria-pressed={action.form === form}
                      className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
                      disabled={!action.enabled}
                      key={form}
                      onClick={() => updateChannelMembersHeaderAction(type, { form })}
                    >
                      {getChannelMembersHeaderActionFormLabel(form)}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
