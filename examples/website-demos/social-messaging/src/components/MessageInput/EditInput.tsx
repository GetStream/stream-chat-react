import React, { useCallback } from 'react';
import { ImageDropzone } from 'react-file-utils';

import {
  ChatAutoComplete,
  EmojiPicker,
  MessageInputProps,
  UploadsPreview,
  useMessageInputContext,
  useChannelStateContext,
} from 'stream-chat-react';

import { EmojiPickerIcon, QuoteArrow, SendCheck } from '../../assets';

import './SocialMessageInput.scss';

type Props = MessageInputProps & {
  checked?: boolean;
  setChecked?: React.Dispatch<React.SetStateAction<boolean>>;
  threadInput?: boolean;
};

export const EditInput = (props: Props) => {
  const {
    emojiPickerRef,
    handleChange,
    handleSubmit,
    numberOfUploads,
    openEmojiPicker,
    text,
  } = useMessageInputContext();

  const { acceptedFiles, maxNumberOfFiles, multipleUploads } = useChannelStateContext();

  const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      handleChange(event);
    },
    [text, numberOfUploads], // eslint-disable-line
  );

  return (
    <>
      <div className='input-ui'>
        <div className='input-ui-icons'>
          <div className='input-ui-icons-arrow'>
            <QuoteArrow />
          </div>
        </div>
        <ImageDropzone
          accept={acceptedFiles}
          handleFiles={useMessageInputContext().uploadNewFiles}
          multiple={multipleUploads}
          disabled={
            maxNumberOfFiles !== undefined &&
            useMessageInputContext().numberOfUploads >= maxNumberOfFiles // eslint-disable-line
          }
        >
          <div className='input-ui-input'>
            <UploadsPreview />
            <div className='input-ui-input-textarea'>
              <ChatAutoComplete onChange={onChange} placeholder='Send a message' />
              <EmojiPicker />
              {
                <>
                  <div
                    className='input-ui-input-emoji-picker'
                    ref={emojiPickerRef}
                    onClick={openEmojiPicker}
                  >
                    <EmojiPickerIcon />
                  </div>
                </>
              }
            </div>
          </div>
        </ImageDropzone>
        <div
          className={`input-ui-send ${text || numberOfUploads ? 'text' : ''}`}
          onClick={handleSubmit}
        >
          <SendCheck />
        </div>
      </div>
    </>
  );
};
