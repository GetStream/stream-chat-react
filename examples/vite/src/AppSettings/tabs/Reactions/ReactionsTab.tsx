import {
  Button,
  ChannelActionProvider,
  ChannelStateProvider,
  ComponentProvider,
  Message,
  useComponentContext,
} from 'stream-chat-react';
import { appSettingsStore, useAppSettingsState } from '../../state';
import {
  reactionsPreviewChannelActions,
  reactionsPreviewChannelState,
  reactionsPreviewMessage,
  reactionsPreviewOptions,
} from './reactionsExampleData';

export const ReactionsTab = () => {
  const state = useAppSettingsState();
  const { reactions } = state;
  const componentContext = useComponentContext();

  return (
    <div className='app__settings-modal__content-stack'>
      <div className='app__settings-modal__field'>
        <div className='app__settings-modal__field-label'>Visual style</div>
        <div className='app__settings-modal__options-row'>
          <Button
            aria-pressed={reactions.visualStyle === 'clustered'}
            className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
            onClick={() =>
              appSettingsStore.partialNext({
                reactions: { ...reactions, visualStyle: 'clustered' },
              })
            }
          >
            Clustered
          </Button>
          <Button
            aria-pressed={reactions.visualStyle === 'segmented'}
            className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
            onClick={() =>
              appSettingsStore.partialNext({
                reactions: { ...reactions, visualStyle: 'segmented' },
              })
            }
          >
            Segmented
          </Button>
        </div>
      </div>

      <div className='app__settings-modal__field'>
        <div className='app__settings-modal__field-label'>Vertical position</div>
        <div className='app__settings-modal__options-row'>
          <Button
            aria-pressed={reactions.verticalPosition === 'top'}
            className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
            onClick={() =>
              appSettingsStore.partialNext({
                reactions: { ...reactions, verticalPosition: 'top' },
              })
            }
          >
            Top
          </Button>
          <Button
            aria-pressed={reactions.verticalPosition === 'bottom'}
            className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
            onClick={() =>
              appSettingsStore.partialNext({
                reactions: { ...reactions, verticalPosition: 'bottom' },
              })
            }
          >
            Bottom
          </Button>
        </div>
      </div>

      <div className='app__settings-modal__field'>
        <div className='app__settings-modal__field-label'>Horizontal alignment</div>
        <div className='app__settings-modal__options-row'>
          <Button
            aria-pressed={!reactions.flipHorizontalPosition}
            className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
            onClick={() =>
              appSettingsStore.partialNext({
                reactions: { ...reactions, flipHorizontalPosition: false },
              })
            }
          >
            Align start
          </Button>
          <Button
            aria-pressed={reactions.flipHorizontalPosition}
            className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
            onClick={() =>
              appSettingsStore.partialNext({
                reactions: { ...reactions, flipHorizontalPosition: true },
              })
            }
          >
            Align end
          </Button>
        </div>
      </div>

      <div className='app__settings-modal__field'>
        <div className='app__settings-modal__field-label'>Preview</div>
        <div className='app__settings-modal__preview'>
          <ChannelActionProvider value={reactionsPreviewChannelActions as never}>
            <ChannelStateProvider value={reactionsPreviewChannelState as never}>
              <ComponentProvider
                value={{
                  ...componentContext,
                  reactionOptions: reactionsPreviewOptions,
                }}
              >
                <li className='str-chat__li--single'>
                  <Message
                    groupStyles={['single']}
                    message={reactionsPreviewMessage}
                    messageActions={[]}
                  />
                </li>
              </ComponentProvider>
            </ChannelStateProvider>
          </ChannelActionProvider>
        </div>
      </div>
    </div>
  );
};
