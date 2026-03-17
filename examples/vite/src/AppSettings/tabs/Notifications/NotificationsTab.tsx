import { Button } from 'stream-chat-react';
import { appSettingsStore, useAppSettingsState } from '../../state';

export const NotificationsTab = () => {
  const {
    notifications,
    notifications: { verticalAlignment },
  } = useAppSettingsState();

  return (
    <div className='app__settings-modal__content-stack'>
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
    </div>
  );
};
