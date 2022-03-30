import { useCallback, useEffect, useState } from 'react';
import {
  ChatAutoComplete,
  CooldownTimer,
  EmojiPicker,
  MessageInputProps,
  useMessageInputContext,
} from 'stream-chat-react';

import { CommandBolt, EmojiPickerIcon, GiphyIcon, GiphySearch, SendArrow } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';
import { useGiphyContext } from '../../contexts/GiphyContext';

type Props = MessageInputProps & {
  checked?: boolean;
  setChecked?: React.Dispatch<React.SetStateAction<boolean>>;
  threadInput?: boolean;
};

export const MessageInputUI = (props: Props) => {
  const { checked, setChecked, threadInput = false } = props;

  const {
    closeCommandsList,
    cooldownRemaining,
    emojiPickerRef,
    handleChange,
    handleSubmit,
    numberOfUploads,
    openCommandsList,
    openEmojiPicker,
    setCooldownRemaining,
    text,
  } = useMessageInputContext();

  const { chatType } = useEventContext();
  const { giphyState, setGiphyState } = useGiphyContext();

  const [commandsOpen, setCommandsOpen] = useState(false);

  const onCheckChange = () => setChecked?.(!checked);

  useEffect(() => {
    const handleClick = () => {
      closeCommandsList();
      setCommandsOpen(false);
    };

    if (commandsOpen) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [commandsOpen]); // eslint-disable-line

  const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      const { value } = event.target;

      const deletePressed =
        event.nativeEvent instanceof InputEvent &&
        event.nativeEvent.inputType === 'deleteContentBackward'
          ? true
          : false;

      if (text.length === 1 && deletePressed) {
        setGiphyState(false);
      }

      if (!giphyState && text.startsWith('/giphy') && !numberOfUploads) {
        event.target.value = value.replace('/giphy', '');
        setGiphyState(true);
      }

      handleChange(event);
    },
    [text, giphyState, numberOfUploads], // eslint-disable-line
  );

  const handleCommandsClick = () => {
    openCommandsList();
    setGiphyState(false);
    setCommandsOpen(true);
  };

  return (
    <>
      <div className='input-ui-container'>
        <EmojiPicker />
        <div className={`input-ui-input ${giphyState ? 'giphy' : ''}`}>
          {giphyState && !numberOfUploads && <GiphyIcon />}
          <ChatAutoComplete onChange={onChange} placeholder='Say something' />
          {chatType !== 'qa' && (
            <>
              <div
                className={`input-ui-input-commands ${cooldownRemaining ? 'cooldown' : ''}`}
                onClick={cooldownRemaining ? () => null : handleCommandsClick}
              >
                <CommandBolt />
              </div>
              {!giphyState && (
                <div
                  className={`input-ui-input-emoji-picker ${cooldownRemaining ? 'cooldown' : ''}`}
                  ref={emojiPickerRef}
                  onClick={cooldownRemaining ? () => null : openEmojiPicker}
                >
                  <EmojiPickerIcon />
                </div>
              )}
            </>
          )}
        </div>
        <div
          className={`input-ui-send ${text ? 'text' : ''} ${cooldownRemaining ? 'cooldown' : ''}`}
          onClick={handleSubmit}
        >
          {giphyState ? (
            <GiphySearch />
          ) : cooldownRemaining ? (
            <div className='input-ui-send-cooldown'>
              <CooldownTimer
                cooldownInterval={cooldownRemaining}
                setCooldownRemaining={setCooldownRemaining}
              />
            </div>
          ) : (
            <>
              <SendArrow />
              <div>{269 - text.length}</div>
            </>
          )}
        </div>
      </div>
      {threadInput && (
        <div className='thread-footer'>
          <input
            checked={checked}
            className='thread-footer-checkbox'
            onChange={onCheckChange}
            type='checkbox'
          />
          <div className='thread-footer-text'>Send also as direct message</div>
        </div>
      )}
    </>
  );
};
