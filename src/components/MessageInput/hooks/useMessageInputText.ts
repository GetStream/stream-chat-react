import { useCallback, useEffect, useRef } from 'react';
import { logChatPromiseExecution } from 'stream-chat';
import type { MessageInputReducerAction, MessageInputState } from './useMessageInputState';
import type { MessageInputProps } from '../MessageInput';
import { useChannelStateContext } from '../../../context/ChannelStateContext';

import type {
  CustomTrigger,
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const useMessageInputText = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>(
  props: MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>,
  state: MessageInputState<At, Us>,
  dispatch: React.Dispatch<MessageInputReducerAction<Us>>,
) => {
  const { channel } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>('useMessageInputText');
  const { additionalTextareaProps, focus, parent, publishTypingEvent = true } = props;
  const { text } = state;

  const textareaRef = useRef<HTMLTextAreaElement>();

  // Focus
  useEffect(() => {
    if (focus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [focus]);

  // Text + cursor position
  const newCursorPosition = useRef<number>();

  const insertText = useCallback(
    (textToInsert: string) => {
      const { maxLength } = additionalTextareaProps || {};

      if (!textareaRef.current) {
        dispatch({
          getNewText: (text) => {
            const updatedText = text + textToInsert;
            if (maxLength && updatedText.length > maxLength) {
              return updatedText.slice(0, maxLength);
            }
            return updatedText;
          },
          type: 'setText',
        });
        return;
      }

      const { selectionEnd, selectionStart } = textareaRef.current;
      newCursorPosition.current = selectionStart + textToInsert.length;

      dispatch({
        getNewText: (prevText) => {
          const updatedText =
            prevText.slice(0, selectionStart) + textToInsert + prevText.slice(selectionEnd);

          if (maxLength && updatedText.length > maxLength) {
            return updatedText.slice(0, maxLength);
          }

          return updatedText;
        },
        type: 'setText',
      });
    },
    [additionalTextareaProps, newCursorPosition, textareaRef],
  );

  useEffect(() => {
    const textareaElement = textareaRef.current;
    if (textareaElement && newCursorPosition.current !== undefined) {
      textareaElement.selectionStart = newCursorPosition.current;
      textareaElement.selectionEnd = newCursorPosition.current;
      newCursorPosition.current = undefined;
    }
  }, [text, newCursorPosition]);

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      event.preventDefault();
      if (!event || !event.target) {
        return;
      }

      const newText = event.target.value;
      dispatch({
        getNewText: () => newText,
        type: 'setText',
      });
      if (publishTypingEvent && newText && channel) {
        logChatPromiseExecution(channel.keystroke(parent?.id), 'start typing event');
      }
    },
    [channel, parent, publishTypingEvent],
  );

  return {
    handleChange,
    insertText,
    textareaRef,
  };
};
