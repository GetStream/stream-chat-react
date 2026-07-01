import { Button } from 'stream-chat-react';
import { appSettingsStore, useAppSettingsState } from '../../state';
import {
  SettingsTabBody,
  SettingsTabLayoutHeader,
} from '../SettingsTabLayoutComponents.tsx';

type NotificationsTabProps = {
  close: () => void;
};

export const NotificationsTab = ({ close }: NotificationsTabProps) => {
  const {
    notifications,
    notifications: { verticalAlignment },
  } = useAppSettingsState();

  return (
    <div className='app__settings-modal__content-stack'>
      <SettingsTabLayoutHeader
        close={close}
        description='Configure where notification prompts appear in the demo app.'
        title='Notifications'
      />

      <SettingsTabBody>
        <div className='app__settings-modal__field'>
          <div className='app__settings-modal__field-label'>Vertical alignment</div>
          <div className='app__settings-modal__options-row'>
            <Button
              aria-pressed={verticalAlignment === 'top'}
              className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
              onClick={() =>
                appSettingsStore.partialNext({
                  notifications: { ...notifications, verticalAlignment: 'top' },
                })
              }
            >
              Top
            </Button>
            <Button
              aria-pressed={verticalAlignment === 'bottom'}
              className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
              onClick={() =>
                appSettingsStore.partialNext({
                  notifications: { ...notifications, verticalAlignment: 'bottom' },
                })
              }
            >
              Bottom
            </Button>
          </div>
        </div>
      </SettingsTabBody>
    </div>
  );
};
