import { useCallback, useState } from 'react';
import { ChatAutoComplete, EmojiPicker, useMessageInputContext } from 'stream-chat-react';
import { EmojiIcon, SendArrow } from '../../assets';

import './MessageInputUI.scss';

export const MessageInputUI: React.FC = () => {
  const { handleSubmit, openEmojiPicker } = useMessageInputContext();

  const [giphyState, setGiphyState] = useState(false);

  const messageInput = useMessageInputContext();

  const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      const { value } = event.target;

      const deletePressed =
        event.nativeEvent instanceof InputEvent &&
        event.nativeEvent.inputType === 'deleteContentBackward'
          ? true
          : false;

      if (messageInput.text.length === 1 && deletePressed) {
        setGiphyState(false);
      }

      if (!giphyState && messageInput.text.startsWith('/giphy') && !messageInput.numberOfUploads) {
        event.target.value = value.replace('/giphy', '');
        setGiphyState(true);
      }

      messageInput.handleChange(event);
    },
    [giphyState, messageInput, setGiphyState],
  );

  const GiphyIcon = () => (
    <div className='giphy-icon__wrapper'>
      <p className='giphy-icon__text'>GIPHY</p>
    </div>
  );

  return (
    <div className='message-input-container'>
      <EmojiPicker />
      <div className='message-input-input'>
        {giphyState && !messageInput.numberOfUploads && <GiphyIcon />}
        <ChatAutoComplete onChange={onChange} placeholder='Say something' />
        <div onClick={openEmojiPicker}>
          <EmojiIcon />
        </div>
      </div>
      <div className='message-input-send'>
        <div onClick={handleSubmit}>
          <SendArrow />
        </div>
        <div>269</div>
      </div>
    </div>
  );
};
