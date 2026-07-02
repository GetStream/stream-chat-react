import { useState } from 'react';
import clsx from 'clsx';
import { SKIN_TONES } from './skinTones';
import { useTranslationContext } from '../../../context';

export type SkinToneSelectorProps = {
  onSelect: (skinToneIndex: number) => void;
  skinToneIndex: number;
};

/**
 * Skin-tone picker rendered in the footer. Collapsed to the active tone; expands to
 * a radiogroup of all tones on activation.
 */
export const SkinToneSelector = ({ onSelect, skinToneIndex }: SkinToneSelectorProps) => {
  const { t } = useTranslationContext('EmojiPickerSkinTone');
  const [expanded, setExpanded] = useState(false);
  const activeTone = SKIN_TONES[skinToneIndex] ?? SKIN_TONES[0];

  if (!expanded) {
    return (
      <button
        aria-label={t('aria/Choose default skin tone')}
        className='str-chat__emoji-picker__skin-tone-toggle'
        onClick={() => setExpanded(true)}
        type='button'
      >
        <span aria-hidden='true'>{activeTone.glyph}</span>
      </button>
    );
  }

  return (
    <div
      aria-label={t('aria/Choose default skin tone')}
      className='str-chat__emoji-picker__skin-tones'
      role='radiogroup'
    >
      {SKIN_TONES.map((tone, index) => (
        <button
          aria-checked={index === skinToneIndex}
          aria-label={t(tone.labelKey)}
          className={clsx('str-chat__emoji-picker__skin-tone', {
            'str-chat__emoji-picker__skin-tone--active': index === skinToneIndex,
          })}
          key={tone.labelKey}
          onClick={() => {
            onSelect(index);
            setExpanded(false);
          }}
          role='radio'
          type='button'
        >
          <span aria-hidden='true'>{tone.glyph}</span>
        </button>
      ))}
    </div>
  );
};
