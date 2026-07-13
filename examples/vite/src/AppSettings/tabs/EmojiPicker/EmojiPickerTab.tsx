import EmojiMartPickerImport from '@emoji-mart/react';
import { type ComponentType, useState } from 'react';
import { Button } from 'stream-chat-react';
import { EmojiPickerPanel, type EmojiSelection } from 'stream-chat-react/emojis';
import {
  appSettingsStore,
  DEFAULT_EMOJI_PICKER_SETTINGS,
  type EmojiPickerSettingsState,
  useAppSettingsSelector,
  useAppSettingsState,
} from '../../state';
import {
  SettingsTabBody,
  SettingsTabLayoutHeader,
} from '../SettingsTabLayoutComponents.tsx';

// @emoji-mart/react ships CJS-on-default; unwrap for strict-ESM (Vite 8) interop.
const EmojiMart = ((EmojiMartPickerImport as { default?: unknown }).default ??
  EmojiMartPickerImport) as ComponentType<Record<string, unknown>>;

type EmojiPickerTabProps = {
  close: () => void;
};

const OPTION_BUTTON_CLASS =
  'app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm';

const update = (patch: Partial<EmojiPickerSettingsState>) => {
  const current = appSettingsStore.getLatestValue().emojiPicker;
  appSettingsStore.partialNext({ emojiPicker: { ...current, ...patch } });
};

type FieldProps<T extends string | number | boolean> = {
  label: string;
  onSelect: (value: T) => void;
  options: { label: string; value: T }[];
  value: T;
};

function Field<T extends string | number | boolean>({
  label,
  onSelect,
  options,
  value,
}: FieldProps<T>) {
  return (
    <div className='app__settings-modal__field'>
      <div className='app__settings-modal__field-label'>{label}</div>
      <div className='app__settings-modal__options-row'>
        {options.map((option) => (
          <Button
            aria-pressed={value === option.value}
            className={OPTION_BUTTON_CLASS}
            key={String(option.value)}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Always-open picker wired to the current settings, so tweaks show instantly without
 * opening the composer. Skin tone and frequently-used are local to the preview —
 * selecting an emoji here feeds the "frequently used" row.
 */
const EmojiPickerPreview = ({ options }: { options: EmojiPickerSettingsState }) => {
  const { mode } = useAppSettingsSelector((state) => state.theme);
  const { autoFocus, engine } = options;
  const [skinTone, setSkinTone] = useState(0);
  const [frequentlyUsedIds, setFrequentlyUsedIds] = useState<string[]>([]);

  // The deprecated emoji-mart picker renders inline too and honors the same option
  // names, so the shared controls drive both engines.
  if (engine === 'emoji-mart') {
    return (
      <EmojiMart
        autoFocus={autoFocus}
        data={async () => (await import('@emoji-mart/data')).default}
        onEmojiSelect={() => undefined}
        theme={mode}
      />
    );
  }

  return (
    <EmojiPickerPanel
      autoFocus={autoFocus}
      frequentlyUsedIds={frequentlyUsedIds}
      onEmojiSelect={(emoji: EmojiSelection) =>
        setFrequentlyUsedIds((ids) => [emoji.id, ...ids.filter((id) => id !== emoji.id)])
      }
      onSkinToneChange={setSkinTone}
      skinToneIndex={skinTone}
    />
  );
};

/**
 * Playground for the built-in `StreamEmojiPicker`. Each control writes to the app
 * settings store; the live preview (and the composer's picker via
 * `EmojiPickerWithCustomOptions`) reflect the change instantly.
 */
export const EmojiPickerTab = ({ close }: EmojiPickerTabProps) => {
  const { emojiPicker } = useAppSettingsState();
  const atDefaults = (
    Object.keys(DEFAULT_EMOJI_PICKER_SETTINGS) as (keyof EmojiPickerSettingsState)[]
  ).every((key) => emojiPicker[key] === DEFAULT_EMOJI_PICKER_SETTINGS[key]);

  return (
    <div className='app__settings-modal__content-stack'>
      <SettingsTabLayoutHeader
        close={close}
        description='Switch between the Stream (native) and deprecated emoji-mart pickers. The live preview and the composer’s picker both update instantly.'
        title='Emoji Picker'
      />

      <SettingsTabBody>
        <div className='app__emoji-settings'>
          <div className='app__emoji-settings__controls'>
            <div className='app__settings-modal__reset-row'>
              <Button
                className='str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
                disabled={atDefaults}
                onClick={() =>
                  appSettingsStore.partialNext({
                    emojiPicker: DEFAULT_EMOJI_PICKER_SETTINGS,
                  })
                }
              >
                Reset to defaults
              </Button>
            </div>
            <Field<EmojiPickerSettingsState['engine']>
              label='Picker engine'
              onSelect={(engine) => update({ engine })}
              options={[
                { label: 'Stream (native)', value: 'stream' },
                { label: 'emoji-mart (deprecated)', value: 'emoji-mart' },
              ]}
              value={emojiPicker.engine}
            />
            <Field<boolean>
              label='Auto-focus search'
              onSelect={(autoFocus) => update({ autoFocus })}
              options={[
                { label: 'On', value: true },
                { label: 'Off', value: false },
              ]}
              value={emojiPicker.autoFocus}
            />
          </div>
          <div className='app__emoji-settings__preview'>
            <div className='app__settings-modal__field-label'>Live preview</div>
            <EmojiPickerPreview options={emojiPicker} />
          </div>
        </div>
      </SettingsTabBody>
    </div>
  );
};
