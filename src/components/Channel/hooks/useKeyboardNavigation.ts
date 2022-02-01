import { useCallback, useEffect, useRef, useState } from 'react';

import type { ChannelState, Channel as StreamChannel } from 'stream-chat';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const useKeyboardNavigation = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  channel: StreamChannel<At, Ch, Co, Ev, Me, Re, Us>,
  state: ChannelState<At, Ch, Co, Ev, Me, Re, Us>,
  openThread: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
    event: React.BaseSyntheticEvent | KeyboardEvent,
  ) => void,
  closeThread: (event: React.BaseSyntheticEvent | KeyboardEvent) => void,
) => {
  const regularMessages = channel.state.messages.filter((m) => m.type === 'regular');
  const numberOfRegularMessages = regularMessages.length;
  const messageElements = document.getElementsByClassName('str-chat__message--regular');
  const actionsBox = document.querySelector('.str-chat__message-actions-box--open');
  const actionElements = actionsBox?.querySelectorAll('.str-chat__message-actions-list-item');
  const reactionElements = document.getElementsByClassName('str-chat__message-reactions-list-item');
  const modalElement = document.getElementsByClassName('str-chat__modal--open');
  // modalIsOpen - modalOpen
  const emojiMart = document.getElementsByClassName('emoji-mart');

  const [focusedMessage, setFocusedMessage] = useState<number>(numberOfRegularMessages);
  const [focusedAction, setFocusedAction] = useState<number>(0);
  const [focusMessage, setFocusMessage] = useState<boolean>(false);

  const channelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!reactionElements[0] && !modalElement[0] && !emojiMart[0]) {
        if (
          channelRef &&
          event.target instanceof HTMLElement &&
          channelRef.current?.contains(event.target)
        ) {
          const actionsBox = document.querySelector('.str-chat__message-actions-box--open');
          const actionElements = actionsBox?.querySelectorAll(
            '.str-chat__message-actions-list-item',
          );
          const inputHasText = textareaRef.current?.childNodes[0];

          if (
            !actionElements &&
            !state.thread &&
            (!inputHasText || !textareaRef?.current?.contains(document.activeElement))
          ) {
            if (event.key === 'ArrowUp') {
              if (numberOfRegularMessages) {
                if (focusedMessage === 0) return;
                else {
                  event.preventDefault();
                  setFocusedMessage((prevFocused) => prevFocused - 1);
                }
              }
            }

            if (event.key === 'ArrowDown') {
              if (!numberOfRegularMessages || focusedMessage === numberOfRegularMessages) return;
              if (focusedMessage === numberOfRegularMessages - 1) {
                textareaRef?.current?.focus();
                setFocusedMessage((prevFocused) => prevFocused + 1);
              } else setFocusedMessage((prevFocused) => prevFocused + 1);
            }

            if (event.key === 'ArrowRight') {
              const message = regularMessages[focusedMessage];
              if (message) {
                openThread(message, event);
              }
            }

            if (event.key === 'ArrowLeft') {
              closeThread(event);
            }

            if (event.key === 'Tab' && event.shiftKey) {
              const messageHasFocus = Array.from(messageElements).some(
                (message) => message === document.activeElement,
              );
              if (messageHasFocus) {
                const channelList = document.getElementsByClassName(
                  'str-chat__channel-list-messenger__main',
                )[0];
                if (channelList instanceof HTMLDivElement) {
                  event.preventDefault();
                  channelList.focus();
                }
              }
            }
          } else if (actionElements) {
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setFocusedAction((prevFocused) => {
                if (actionElements) {
                  return prevFocused === 0 ? actionElements?.length - 1 : prevFocused - 1;
                } else return 0;
              });
            }

            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setFocusedAction((prevFocused) => {
                if (actionElements) {
                  return prevFocused === actionElements?.length - 1 ? 0 : prevFocused + 1;
                } else return 0;
              });
            }

            if (event.key === 'Tab') {
              event.preventDefault();
              return;
            }

            if (event.key === 'Enter') setFocusedAction(0);
          }
        } else if ((event.key === 'Tab' && !event.shiftKey) || event.key === 'ArrowRight') {
          const loadMoreButton = document.getElementsByClassName(
            'str-chat__load-more-button__button',
          )[0];

          if (loadMoreButton === document.activeElement) {
            event.preventDefault();
            textareaRef?.current?.focus();
          } else {
            const channelList = document.getElementsByClassName(
              'str-chat__channel-list-messenger__main',
            )[0];
            const channelPreview = document.getElementsByClassName(
              'str-chat__channel-preview-messenger',
            );
            const channelPreviewHasFocus = Array.from(channelPreview).some((channel) =>
              channel.contains(document.activeElement),
            );

            if (
              channelPreviewHasFocus ||
              (!loadMoreButton && channelList === document.activeElement)
            ) {
              event.preventDefault();
              textareaRef?.current?.focus();
            }
          }
        }
      } else if (modalElement[0]) {
        if (event.key === 'Tab') {
          const sendElement = document.getElementsByClassName('str-chat__send')[0];

          if (
            !event.shiftKey &&
            (sendElement === event.target ||
              (event.target as HTMLButtonElement).classList.contains(
                'image-gallery-fullscreen-button',
              ))
          ) {
            event.preventDefault();
            return;
          }

          if (
            event.shiftKey &&
            (event.target as HTMLButtonElement).classList.contains('str-chat__modal__close-button')
          ) {
            event.preventDefault();
            return;
          }
        }
      }
    },
    [focusedMessage, state.thread],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (actionElements) {
      (actionElements[focusedAction] as HTMLElement)?.focus();
    }
  }, [focusedAction]);

  useEffect(() => {
    (messageElements[focusedMessage] as HTMLElement)?.focus();
  }, [focusedMessage, focusMessage]);

  return { channelRef, setFocusMessage, textareaRef };
};
