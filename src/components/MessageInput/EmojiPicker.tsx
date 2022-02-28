import React, { Suspense } from 'react';

import { useEmojiContext } from '../../context/EmojiContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { EmojiData } from 'emoji-mart';

import { useMessageInputContext } from '../../context/MessageInputContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

const filterEmoji = (emoji: EmojiData) => {
  if (emoji.name === 'White Smiling Face' || emoji.name === 'White Frowning Face') {
    return false;
  }
  return true;
};

export type MessageInputEmojiPickerProps = {
  small?: boolean;
};

export const EmojiPicker = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageInputEmojiPickerProps,
) => {
  const { small } = props;

  const { emojiConfig, EmojiPicker: EmojiPickerComponent } = useEmojiContext('EmojiPicker');
  const { t } = useTranslationContext('EmojiPicker');

  const messageInput = useMessageInputContext<StreamChatGenerics>('EmojiPicker');

  const { emojiData } = emojiConfig || {};

  if (messageInput.emojiPickerIsOpen && emojiData) {
    const className = small
      ? 'str-chat__small-message-input-emojipicker'
      : 'str-chat__input--emojipicker';

    return (
      <div className={className} ref={messageInput.emojiPickerRef}>
        <Suspense fallback={null}>
          <EmojiPickerComponent
            color='#006CFF'
            data={emojiData}
            emoji='point_up'
            emojisToShowFilter={filterEmoji}
            native
            onSelect={messageInput.onSelectEmoji}
            set='facebook'
            showPreview={false}
            showSkinTones={false}
            title={t('Pick your emoji')}
            useButton
          />
        </Suspense>
      </div>
    );
  }
  return null;
};
