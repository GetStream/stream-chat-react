import React, { useContext } from 'react';
import clsx from 'clsx';

import {
  AttachmentSelector as DefaultAttachmentSelector,
  SimpleAttachmentSelector,
} from './AttachmentSelector/AttachmentSelector';
import { AudioRecorder as DefaultAudioRecorder } from '../MediaRecorder';
import { SendToChannelCheckbox as DefaultSendToChannelCheckbox } from './SendToChannelCheckbox';
import { TextareaComposer as DefaultTextareaComposer } from '../TextareaComposer';
import { useMessageComposerContext as useMessageComposerContext } from '../../context/MessageComposerContext';
import { useComponentContext } from '../../context/ComponentContext';
import { MessageContext } from '../../context';
import { WithDragAndDropUpload } from './WithDragAndDropUpload';
import {
  AdditionalMessageComposerActions as DefaultAdditionalMessageComposerActions,
  MessageComposerActions,
} from './MessageComposerActions';
import { useMessageComposerController } from './hooks';
import { useStateStore } from '../../store';
import type { TextComposerState } from 'stream-chat';
import { CommandChip as DefaultCommandChip } from './CommandChip';
import { MessageComposerPreviews as DefaultMessageComposerPreviews } from './MessageComposerPreviews';

const textComposerCommandSelector = ({ command }: TextComposerState) => ({ command });

export const MessageComposerUI = () => {
  // A message context is only present while editing a message.
  const { message } = useContext(MessageContext) ?? {};
  const { recordingController } = useMessageComposerContext();
  const messageComposerController = useMessageComposerController();
  const { command } = useStateStore(
    messageComposerController.textComposer.state,
    textComposerCommandSelector,
  );

  const {
    AdditionalMessageComposerActions = DefaultAdditionalMessageComposerActions,
    AttachmentSelector = message ? SimpleAttachmentSelector : DefaultAttachmentSelector,
    AudioRecorder = DefaultAudioRecorder,
    CommandChip = DefaultCommandChip,
    MessageComposerPreviews = DefaultMessageComposerPreviews,
    SendToChannelCheckbox = DefaultSendToChannelCheckbox,
    TextareaComposer = DefaultTextareaComposer,
  } = useComponentContext();

  return (
    <WithDragAndDropUpload
      className='str-chat__message-composer-container'
      component='div'
    >
      <div
        className={clsx('str-chat__message-composer', {
          'str-chat__message-composer--command-active': !!command,
        })}
      >
        {recordingController.recordingState ? (
          <AudioRecorder />
        ) : (
          <>
            <AttachmentSelector />
            <div className='str-chat__message-composer-compose-area'>
              <MessageComposerPreviews />
              <div className='str-chat__message-composer-controls'>
                <div className='str-chat__message-composer-controls__text-composition-controls'>
                  <div className='str-chat__message-composer-controls__text-composition-controls__text'>
                    {command && (
                      <div className='str-chat__message-composer-controls__text-composition-controls__command-chip-container'>
                        <CommandChip command={command} />
                      </div>
                    )}
                    <TextareaComposer />
                  </div>
                  <SendToChannelCheckbox />
                </div>
                <AdditionalMessageComposerActions />
                <MessageComposerActions />
              </div>
            </div>
          </>
        )}
      </div>
    </WithDragAndDropUpload>
  );
};
