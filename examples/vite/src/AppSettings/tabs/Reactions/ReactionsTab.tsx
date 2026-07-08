import {
  Button,
  ChannelInstanceProvider,
  ComponentProvider,
  Message,
  useComponentContext,
} from 'stream-chat-react';
import { appSettingsStore, useAppSettingsState } from '../../state';
import {
  SettingsTabBody,
  SettingsTabLayoutHeader,
} from '../SettingsTabLayoutComponents.tsx';
import {
  reactionsPreviewChannelState,
  reactionsPreviewMessage,
  reactionsPreviewOptions,
} from './reactionsExampleData';

type ReactionsTabProps = {
  close: () => void;
};

export const ReactionsTab = ({ close }: ReactionsTabProps) => {
  const state = useAppSettingsState();
  const { reactions } = state;
  const componentContext = useComponentContext();

  return (
    <div className='app__settings-modal__content-stack'>
      <SettingsTabLayoutHeader
        close={close}
        description='Configure how reaction UI variants are rendered in the message preview.'
        title='Reactions'
      />

      <SettingsTabBody>
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
              aria-pressed={reactions.flipHorizontalPosition}
              className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
              onClick={() =>
                appSettingsStore.partialNext({
                  reactions: { ...reactions, flipHorizontalPosition: true },
                })
              }
            >
              Align start
            </Button>
            <Button
              aria-pressed={!reactions.flipHorizontalPosition}
              className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
              onClick={() =>
                appSettingsStore.partialNext({
                  reactions: { ...reactions, flipHorizontalPosition: false },
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
            {/* MERGE-RECONCILE: PR #2909 replaced the deleted ChannelState/ChannelAction
                providers with ChannelInstanceProvider (Message now reads useChannel()). */}
            <ChannelInstanceProvider
              value={{ channel: reactionsPreviewChannelState.channel as never }}
            >
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
            </ChannelInstanceProvider>
          </div>
        </div>
      </SettingsTabBody>
    </div>
  );
};
