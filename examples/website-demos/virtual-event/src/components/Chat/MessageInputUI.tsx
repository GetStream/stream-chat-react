import { useCallback, useEffect, useState } from 'react';
import { ChatAutoComplete, EmojiPicker, useMessageInputContext } from 'stream-chat-react';

import { CommandBolt, EmojiPickerIcon, GiphyIcon, GiphySearch, SendArrow } from '../../assets';
import { useGiphyContext } from '../../contexts/GiphyContext';

export const MessageInputUI: React.FC = () => {
  const {
    closeCommandsList,
    emojiPickerRef,
    handleChange,
    handleSubmit,
    numberOfUploads,
    openCommandsList,
    openEmojiPicker,
    text,
  } = useMessageInputContext();

  const { giphyState, setGiphyState } = useGiphyContext();

  const [commandsOpen, setCommandsOpen] = useState(false);

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
    <div className='input-ui-container'>
      <EmojiPicker />
      <div className={`input-ui-input ${giphyState ? 'giphy' : ''}`}>
        {giphyState && !numberOfUploads && <GiphyIcon />}
        <ChatAutoComplete onChange={onChange} placeholder='Say something' />
        <div className='input-ui-input-commands' onClick={handleCommandsClick}>
          <CommandBolt />
        </div>
        {!giphyState && (
          <div
            className='input-ui-input-emoji-picker'
            ref={emojiPickerRef}
            onClick={openEmojiPicker}
          >
            <EmojiPickerIcon />
          </div>
        )}
      </div>
      <div className={`input-ui-send ${text ? 'text' : ''}`} onClick={handleSubmit}>
        {giphyState ? (
          <GiphySearch />
        ) : (
          <>
            <SendArrow />
            <div>269</div>
          </>
        )}
      </div>
    </div>
  );
};
