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

const numberOptions = (values: number[]) =>
  values.map((value) => ({ label: String(value), value }));

/**
 * Always-open picker wired to the current settings, so tweaks show instantly without
 * opening the composer. Skin tone and frequently-used are local to the preview —
 * selecting an emoji here feeds the "frequently used" row so `maxFrequentRows` can be
 * exercised too.
 */
const EmojiPickerPreview = ({ options }: { options: EmojiPickerSettingsState }) => {
  const { mode } = useAppSettingsSelector((state) => state.theme);
  const { engine, ...pickerOptions } = options;
  const [skinTone, setSkinTone] = useState(0);
  const [frequentlyUsedIds, setFrequentlyUsedIds] = useState<string[]>([]);

  // The deprecated emoji-mart picker renders inline too and honors the same
  // emoji-mart-compatible option names, so the same controls drive both engines.
  if (engine === 'emoji-mart') {
    return (
      <EmojiMart
        {...pickerOptions}
        data={async () => (await import('@emoji-mart/data')).default}
        onEmojiSelect={() => undefined}
        theme={mode}
      />
    );
  }

  return (
    <EmojiPickerPanel
      frequentlyUsedIds={frequentlyUsedIds}
      onEmojiSelect={(emoji: EmojiSelection) =>
        setFrequentlyUsedIds((ids) => [emoji.id, ...ids.filter((id) => id !== emoji.id)])
      }
      onSkinToneChange={setSkinTone}
      options={{ ...pickerOptions, exceptEmojis: [] }}
      skinToneIndex={skinTone}
    />
  );
};

/**
 * Playground for the built-in EmojiPicker's `pickerProps`. Each control writes to the
 * app settings store; the live preview (and the composer's picker via
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
        description='Switch between the Stream (native) and deprecated emoji-mart pickers, and configure pickerProps. The live preview and the composer’s picker both update instantly.'
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
            <Field<EmojiPickerSettingsState['navPosition']>
              label='Navigation position'
              onSelect={(navPosition) => update({ navPosition })}
              options={[
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' },
                { label: 'None', value: 'none' },
              ]}
              value={emojiPicker.navPosition}
            />
            <Field<EmojiPickerSettingsState['previewPosition']>
              label='Preview position'
              onSelect={(previewPosition) => update({ previewPosition })}
              options={[
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' },
                { label: 'None', value: 'none' },
              ]}
              value={emojiPicker.previewPosition}
            />
            <Field<EmojiPickerSettingsState['searchPosition']>
              label='Search position'
              onSelect={(searchPosition) => update({ searchPosition })}
              options={[
                { label: 'Sticky', value: 'sticky' },
                { label: 'Static', value: 'static' },
                { label: 'None', value: 'none' },
              ]}
              value={emojiPicker.searchPosition}
            />
            <Field<EmojiPickerSettingsState['skinTonePosition']>
              label='Skin-tone position'
              onSelect={(skinTonePosition) => update({ skinTonePosition })}
              options={[
                { label: 'Preview', value: 'preview' },
                { label: 'Search', value: 'search' },
                { label: 'None', value: 'none' },
              ]}
              value={emojiPicker.skinTonePosition}
            />
            <Field<number>
              label='Emoji per line'
              onSelect={(perLine) => update({ perLine })}
              options={numberOptions([7, 8, 9, 10])}
              value={emojiPicker.perLine}
            />
            <Field<number>
              label='Frequently-used rows'
              onSelect={(maxFrequentRows) => update({ maxFrequentRows })}
              options={numberOptions([1, 2, 3, 4])}
              value={emojiPicker.maxFrequentRows}
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
            <Field<boolean>
              label='Country flags'
              onSelect={(noCountryFlags) => update({ noCountryFlags })}
              options={[
                { label: 'Show', value: false },
                { label: 'Hide', value: true },
              ]}
              value={emojiPicker.noCountryFlags}
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
