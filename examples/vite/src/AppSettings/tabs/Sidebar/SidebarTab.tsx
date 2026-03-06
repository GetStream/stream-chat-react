import { Button } from 'stream-chat-react';
import { appSettingsStore, useAppSettingsState } from '../../state';

export const SidebarTab = () => {
  const {
    chatView,
    chatView: { showLabels },
  } = useAppSettingsState();

  return (
    <div className='app__settings-modal__content-stack'>
      <div className='app__settings-modal__field'>
        <div className='app__settings-modal__field-label'>Label visibility</div>
        <div className='app__settings-modal__options-row'>
          <Button
            aria-pressed={!showLabels}
            className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
            onClick={() =>
              appSettingsStore.partialNext({
                chatView: { ...chatView, showLabels: false },
              })
            }
          >
            Icons only
          </Button>
          <Button
            aria-pressed={showLabels}
            className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
            onClick={() =>
              appSettingsStore.partialNext({
                chatView: { ...chatView, showLabels: true },
              })
            }
          >
            Show labels
          </Button>
        </div>
      </div>
    </div>
  );
};
