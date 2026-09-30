import { Button } from 'stream-chat-react';
import { appSettingsStore, useAppSettingsState } from '../../state';
import {
  SettingsTabBody,
  SettingsTabLayoutHeader,
} from '../SettingsTabLayoutComponents.tsx';

type GeneralTabProps = {
  close: () => void;
};

export const GeneralTab = ({ close }: GeneralTabProps) => {
  const {
    messageList,
    pageLayout,
    theme,
    theme: { direction },
  } = useAppSettingsState();

  return (
    <div className='app__settings-modal__content-stack'>
      <SettingsTabLayoutHeader
        close={close}
        description='Configure global demo behavior such as text direction and message list rendering.'
        title='General'
      />

      <SettingsTabBody>
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
        <div className='app__settings-modal__field'>
          <div className='app__settings-modal__field-label'>Message list</div>
          <div className='app__settings-modal__options-row'>
            <Button
              aria-pressed={messageList.type === 'standard'}
              className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
              onClick={() =>
                appSettingsStore.partialNext({
                  messageList: { type: 'standard' },
                })
              }
            >
              Standard
            </Button>
            <Button
              aria-pressed={messageList.type === 'virtualized'}
              className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
              onClick={() =>
                appSettingsStore.partialNext({
                  messageList: { type: 'virtualized' },
                })
              }
            >
              Virtualized
            </Button>
          </div>
        </div>
        <div className='app__settings-modal__field'>
          <div className='app__settings-modal__field-label'>Page layout</div>
          <div className='app__settings-modal__options-row'>
            <Button
              aria-pressed={!pageLayout.embedded}
              className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
              onClick={() =>
                appSettingsStore.partialNext({ pageLayout: { embedded: false } })
              }
            >
              Full viewport
            </Button>
            <Button
              aria-pressed={pageLayout.embedded}
              className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
              onClick={() =>
                appSettingsStore.partialNext({ pageLayout: { embedded: true } })
              }
            >
              Embedded in page
            </Button>
          </div>
          <div className='app__settings-modal__field-comment'>
            Embedded places the chat between host-page content taller than the viewport,
            so the window scrolls too. Use it to check that scrolling inside the chat
            (e.g. jumping to unread or quoted messages) leaves the page in place.
          </div>
        </div>
      </SettingsTabBody>
    </div>
  );
};
