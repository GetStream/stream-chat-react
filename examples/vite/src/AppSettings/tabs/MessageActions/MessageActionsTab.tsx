import { SwitchField } from 'stream-chat-react';
import { appSettingsStore, useAppSettingsState } from '../../state';
import {
  SettingsTabBody,
  SettingsTabLayoutHeader,
} from '../SettingsTabLayoutComponents.tsx';

type MessageActionsTabProps = {
  close: () => void;
};

export const MessageActionsTab = ({ close }: MessageActionsTabProps) => {
  const {
    messageActions,
    messageActions: { customMessageActions },
  } = useAppSettingsState();

  return (
    <div className='app__settings-modal__content-stack'>
      <SettingsTabLayoutHeader
        close={close}
        description='Configure the message actions exposed by the demo app.'
        title='Message Actions'
      />

      <SettingsTabBody>
        <div className='app__settings-modal__field'>
          <div className='app__settings-modal__field-label'>Delete message</div>
          <SwitchField
            checked={customMessageActions.delete.enableOptionConfiguration}
            id='delete-enable-option-configuration-switch'
            onChange={(event) =>
              appSettingsStore.partialNext({
                messageActions: {
                  ...messageActions,
                  customMessageActions: {
                    ...customMessageActions,
                    delete: {
                      enableOptionConfiguration: event.target.checked,
                    },
                  },
                },
              })
            }
          >
            Enabled option configuration
          </SwitchField>
          <div className='app__settings-modal__field-comment'>
            It enables to configure delete request params in the Delete Message Alert like
            <strong>&ldquo;Delete only for me&rdquo;</strong>,{' '}
            <strong>&ldquo;Hard delete&rdquo;</strong>.
          </div>
        </div>

        <div className='app__settings-modal__field'>
          <div className='app__settings-modal__field-label'>Mark as unread</div>
          <SwitchField
            checked={customMessageActions.markOwnUnread}
            id='mark-own-messages-unread-switch'
            onChange={(event) =>
              appSettingsStore.partialNext({
                messageActions: {
                  ...messageActions,
                  customMessageActions: {
                    ...customMessageActions,
                    markOwnUnread: event.target.checked,
                  },
                },
              })
            }
          >
            Mark own messages as unread too
          </SwitchField>
        </div>

        <div className='app__settings-modal__field'>
          <div className='app__settings-modal__field-label'>View message info</div>
          <SwitchField
            checked={customMessageActions.viewMessageInfo}
            id='view-message-info-switch'
            onChange={(event) =>
              appSettingsStore.partialNext({
                messageActions: {
                  ...messageActions,
                  customMessageActions: {
                    ...customMessageActions,
                    viewMessageInfo: event.target.checked,
                  },
                },
              })
            }
          >
            Show JSON viewer action in the message actions menu
          </SwitchField>
        </div>
      </SettingsTabBody>
    </div>
  );
};
