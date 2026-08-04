import { useMemo, useState } from 'react';
import type { ChannelPaginatorsOrchestratorState } from 'stream-chat';
import { Button, useChatContext, useStateStore } from 'stream-chat-react';
import { appSettingsStore, useAppSettingsState } from '../../state';
import { SearchableSelect, type SearchableSelectOption } from '../../SearchableSelect';
import {
  SettingsTabBody,
  SettingsTabLayoutHeader,
} from '../SettingsTabLayoutComponents.tsx';

type GeneralTabProps = {
  close: () => void;
};

const paginatorsSelector = (state: ChannelPaginatorsOrchestratorState) => ({
  paginators: state.paginators,
});

export const GeneralTab = ({ close }: GeneralTabProps) => {
  const {
    messageList,
    theme,
    theme: { direction },
  } = useAppSettingsState();

  // The channel picked here is a draft — it doesn't open the modal until "Open" commits it to
  // `layout.channelCid`. Setting it directly would open the modal behind the settings dialog.
  const [draftChannelCid, setDraftChannelCid] = useState('');

  const { channelPaginatorsOrchestrator } = useChatContext();
  const { paginators } = useStateStore(
    channelPaginatorsOrchestrator.state,
    paginatorsSelector,
  );
  // Options for the single-channel selector: a placeholder entry plus every channel the paginators
  // have already loaded (deduped by cid). Memoized so its identity is stable — SearchableSelect
  // derives its trigger from the options, and a fresh array each render would remount the trigger
  // and break anchoring.
  const channelSelectOptions: SearchableSelectOption<string>[] = useMemo(
    () => [
      { label: 'Select a channel…', value: '' },
      ...Array.from(
        new Map(
          paginators.flatMap((paginator) => paginator.items ?? []).map((c) => [c.cid, c]),
        ).values(),
      ).map((channel) => ({
        label:
          (channel.data as { name?: string } | undefined)?.name ??
          channel.id ??
          channel.cid,
        value: channel.cid,
      })),
    ],
    [paginators],
  );

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
          <div className='app__settings-modal__field-label'>Single channel view</div>
          <div>
            Verify the app in a single Channel UI (no channel list) — pick a channel and
            open it in a floating modal over the app.
          </div>
          <div className='app__settings-modal__options-row'>
            <SearchableSelect
              onChange={(cid) => setDraftChannelCid(cid)}
              options={channelSelectOptions}
              searchPlaceholder='Search channels'
              value={draftChannelCid}
            />
            {draftChannelCid && (
              <Button
                appearance='outline'
                className='app__settings-modal__option-button'
                onClick={() => {
                  // Open the floating single-channel modal for the picked channel (setting
                  // `layout.channelCid` is what opens it) and close settings so it's visible.
                  appSettingsStore.partialNext({
                    layout: { channelCid: draftChannelCid },
                  });
                  close();
                }}
                size='sm'
                variant='secondary'
              >
                Open
              </Button>
            )}
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
      </SettingsTabBody>
    </div>
  );
};
