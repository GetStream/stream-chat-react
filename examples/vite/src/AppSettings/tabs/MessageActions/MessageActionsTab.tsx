import { SwitchField } from 'stream-chat-react';
import { appSettingsStore, useAppSettingsState } from '../../state';

export const MessageActionsTab = () => {
  const {
    messageActions,
    messageActions: { customMessageActions },
  } = useAppSettingsState();

  return (
    <div className='app__settings-modal__content-stack'>
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
          <strong>"Delete only for me"</strong>, <strong>"Hard delete"</strong>.
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
    </div>
  );
};
