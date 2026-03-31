import { Button } from 'stream-chat-react';
import { appSettingsStore, useAppSettingsState } from '../../state';

export const GeneralTab = () => {
  const {
    theme,
    theme: { direction },
  } = useAppSettingsState();

  return (
    <div className='app__settings-modal__content-stack'>
      <div className='app__settings-modal__field'>
        <div className='app__settings-modal__field-label'>Text direction</div>
        <div className='app__settings-modal__options-row'>
          <Button
            aria-pressed={direction === 'ltr'}
            className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
            onClick={() =>
              appSettingsStore.partialNext({
                theme: { ...theme, direction: 'ltr' },
              })
            }
          >
            LTR
          </Button>
          <Button
            aria-pressed={direction === 'rtl'}
            className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
            onClick={() =>
              appSettingsStore.partialNext({
                theme: { ...theme, direction: 'rtl' },
              })
            }
          >
            RTL
          </Button>
        </div>
      </div>
    </div>
  );
};
