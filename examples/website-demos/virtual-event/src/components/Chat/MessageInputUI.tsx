import { useCallback } from 'react';
import { ChatAutoComplete, EmojiPicker, useMessageInputContext } from 'stream-chat-react';

import { EmojiPickerIcon, GiphyIcon, GiphySearch, SendArrow } from '../../assets';
import { useGiphyContext } from '../../contexts/GiphyContext';

export const MessageInputUI: React.FC = () => {
  const {
    emojiPickerRef,
    handleChange,
    handleSubmit,
    numberOfUploads,
    openEmojiPicker,
    text,
  } = useMessageInputContext();

  const { giphyState, setGiphyState } = useGiphyContext();

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

  return (
    <div className='message-input-container'>
      <EmojiPicker />
      <div className={`message-input-input ${giphyState ? 'giphy' : ''}`}>
        {giphyState && !numberOfUploads && <GiphyIcon />}
        <ChatAutoComplete onChange={onChange} placeholder='Say something' />
        {!giphyState && (
          <div
            className='message-input-input-emoji-picker'
            ref={emojiPickerRef}
            onClick={openEmojiPicker}
          >
            <EmojiPickerIcon />
          </div>
        )}
      </div>
      <div className={`message-input-send ${text ? 'text' : ''}`} onClick={handleSubmit}>
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
