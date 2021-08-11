import React, { useCallback } from 'react';
import { ChatAutoComplete, EmojiPicker, useMessageInputContext } from 'stream-chat-react';
import { EmojiPickerIcon, GiphyIcon, GiphySearch, SendArrow } from '../../assets';
import { useGiphyContext } from '../../contexts/GiphyContext';

type Props = {
  checked: boolean;
  setChecked: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ThreadInputUI: React.FC<Props> = (props) => {
  const { checked, setChecked } = props;

  const {
    emojiPickerRef,
    handleChange,
    handleSubmit,
    numberOfUploads,
    openEmojiPicker,
    text,
  } = useMessageInputContext();

  const { giphyState, setGiphyState } = useGiphyContext();

  const onCheckChange = () => {
    setChecked(!checked);
  };

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
    <>
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
        <div
          className={`message-input-send ${text ? 'text' : ''}`}
          onClick={(e) => {
            handleSubmit(e);
            setChecked(false);
          }}
        >
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
      <div className='thread-footer'>
        <input
          checked={checked}
          className='thread-footer-checkbox'
          onChange={onCheckChange}
          type='checkbox'
        />
        <div className='thread-footer-text'>Send also as direct message</div>
      </div>
    </>
  );
};
