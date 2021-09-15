import { useCallback, useEffect, useState } from 'react';
import { ImageDropzone, FileUploadButton } from 'react-file-utils';

import {
  ChatAutoComplete,
  EmojiPicker,
  MessageInputProps,
  UploadsPreview,
  useMessageInputContext,
  useChannelStateContext,
} from 'stream-chat-react';

import {
  Attach,
  CommandBolt,
  EmojiPickerIcon,
  GiphyIcon,
  GiphySearch,
  SendArrow,
} from '../../assets';

import { useGiphyContext } from '../../contexts/GiphyContext';

import './MessageInputUI.scss';

type Props = MessageInputProps & {
  checked?: boolean;
  setChecked?: React.Dispatch<React.SetStateAction<boolean>>;
  threadInput?: boolean;
};

export const MessageInputUI = (props: Props) => {
  const { checked, setChecked, threadInput = false } = props;

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

  const { acceptedFiles, maxNumberOfFiles, multipleUploads } = useChannelStateContext();

  const { giphyState, setGiphyState } = useGiphyContext();

  const messageInput = useMessageInputContext();

  const onCheckChange = () => setChecked?.(!checked);

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
    <>
      <div className='input-ui-container'>
        <div className='input-ui-wrapper'>
          <div className='input-ui-wrapper-attach'>
            <FileUploadButton handleFiles={messageInput.uploadNewFiles}>
              <Attach />
            </FileUploadButton>
          </div>
          <div className='input-ui-wrapper-bolt' onClick={handleCommandsClick}>
            <CommandBolt />
          </div>
        </div>
        <ImageDropzone
          accept={acceptedFiles}
          handleFiles={messageInput.uploadNewFiles}
          multiple={multipleUploads}
          disabled={
            (maxNumberOfFiles !== undefined && messageInput.numberOfUploads >= maxNumberOfFiles) ||
            giphyState
          }
        >
          <EmojiPicker />
          <div className={`input-ui-input ${giphyState ? 'giphy' : ''}`}>
            {giphyState && !numberOfUploads && <GiphyIcon />}
            <UploadsPreview />
            <ChatAutoComplete onChange={onChange} placeholder='Send a message' />
            {
              <>
                {!giphyState && (
                  <div
                    className='input-ui-input-emoji-picker'
                    ref={emojiPickerRef}
                    onClick={openEmojiPicker}
                  >
                    <EmojiPickerIcon />
                  </div>
                )}
              </>
            }
          </div>
        </ImageDropzone>
        <div className={`input-ui-send ${text ? 'text' : ''}`} onClick={handleSubmit}>
          {giphyState ? (
            <GiphySearch />
          ) : (
            <>
              <SendArrow />
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
