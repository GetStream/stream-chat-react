import { Button } from 'stream-chat-react';
import { appSettingsStore, useAppSettingsState } from '../../state';

export const ThemeTab = () => {
  const { theme } = useAppSettingsState();

  return (
    <div className='app__settings-modal__content-stack'>
      <div className='app__settings-modal__field'>
        <div className='app__settings-modal__field-label'>Color mode</div>
        <div className='app__settings-modal__options-row'>
          <Button
            aria-pressed={theme.mode === 'light'}
            className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
            onClick={() =>
              appSettingsStore.partialNext({
                theme: { ...theme, mode: 'light' },
              })
            }
          >
            Light
          </Button>
          <Button
            aria-pressed={theme.mode === 'dark'}
            className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
            onClick={() =>
              appSettingsStore.partialNext({
                theme: { ...theme, mode: 'dark' },
              })
            }
          >
            Dark
          </Button>
        </div>
      </div>
    </div>
  );
};
