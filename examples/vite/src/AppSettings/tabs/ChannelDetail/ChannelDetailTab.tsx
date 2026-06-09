import { Button, SwitchField } from 'stream-chat-react';

import {
  appSettingsStore,
  type ChannelMembersHeaderActionForm,
  type ChannelMembersHeaderActionId,
  useAppSettingsState,
} from '../../state';
import {
  SettingsTabBody,
  SettingsTabLayoutHeader,
} from '../SettingsTabLayoutComponents.tsx';
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

type ChannelDetailTabProps = {
  close: () => void;
};

export const ChannelDetailTab = ({ close }: ChannelDetailTabProps) => {
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
      <SettingsTabLayoutHeader
        close={close}
        description='Configure ChannelDetail modal behavior for the demo app.'
        title='Channel Detail'
      />
      <SettingsTabBody>
        <div className='app__settings-modal__field'>
          <div className='app__settings-modal__field-label'>
            Channel members view actions
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
                    title={channelMembersHeaderActionLabels[type]}
                  ></SwitchField>

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
      </SettingsTabBody>
    </div>
  );
};
