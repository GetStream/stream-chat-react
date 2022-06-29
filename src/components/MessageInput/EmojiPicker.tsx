import React, { Suspense } from 'react';
import clsx from 'clsx';

import { useEmojiContext } from '../../context/EmojiContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { EmojiData } from 'emoji-mart';

import { useMessageInputContext } from '../../context/MessageInputContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

const filterEmoji = (emoji: EmojiData) =>
  !(emoji.name === 'White Smiling Face' || emoji.name === 'White Frowning Face');

export type MessageInputEmojiPickerProps = {
  small?: boolean;
};

export const EmojiPicker = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  small,
}: MessageInputEmojiPickerProps) => {
  const { emojiConfig, EmojiPicker: EmojiPickerComponent } = useEmojiContext('EmojiPicker');
  const { t } = useTranslationContext('EmojiPicker');

  const {
    emojiPickerIsOpen,
    emojiPickerRef,
    onSelectEmoji,
  } = useMessageInputContext<StreamChatGenerics>('EmojiPicker');

  const { emojiData } = emojiConfig || {};

  if (!emojiPickerIsOpen || !emojiData) return null;

  return (
    <div
      className={clsx('str-chat__emoji-picker-container', {
        'str-chat__input--emojipicker': !small,
        'str-chat__small-message-input-emojipicker': small,
      })}
      ref={emojiPickerRef}
    >
      <Suspense fallback={null}>
        <EmojiPickerComponent
          color='#006CFF'
          data={emojiData}
          emoji='point_up'
          emojisToShowFilter={filterEmoji}
          native
          onSelect={onSelectEmoji}
          set='facebook'
          showPreview={false}
          showSkinTones={false}
          title={t('Pick your emoji')}
          useButton
        />
      </Suspense>
    </div>
  );
};
