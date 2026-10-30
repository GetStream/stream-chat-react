import type { MessageComposerState, TextComposerState } from 'stream-chat';
import {
  AttachmentPreviewList,
  AttachmentSelector,
  AudioRecorder,
  CommandChip,
  defaultAttachmentSelectorActionSet,
  LinkPreviewList,
  MessageComposerActions,
  MessageComposerUI,
  QuotedMessagePreview,
  TextareaComposer,
  useMessageComposerContext,
  useMessageComposerController,
  useStateStore,
  VoiceRecordingPreviewSlot,
  WithDragAndDropUpload,
} from 'stream-chat-react';
import { AlsoSendInChannel } from './AlsoSendInChannel';
import './CustomMessageComposer.css';

const editedMessageSelector = ({ editedMessage }: MessageComposerState) => ({
  editedMessage,
});
const commandSelector = ({ command }: TextComposerState) => ({ command });

// Every action of the default menu except Location.
const attachmentActions = defaultAttachmentSelectorActionSet.filter(
  (action) => action.type !== 'addLocation',
);

export const CustomMessageComposer = () => {
  const { recordingController } = useMessageComposerContext();
  const messageComposer = useMessageComposerController();
  const { editedMessage } = useStateStore(messageComposer.state, editedMessageSelector);
  const { command } = useStateStore(messageComposer.textComposer.state, commandSelector);

  // The default UI shows the message being edited, with a button to cancel the edit.
  if (editedMessage) return <MessageComposerUI />;

  // While the user records a voice message, the recorder takes the composer's place.
  if (recordingController.recordingState) return <AudioRecorder />;

  return (
    // Channel and Thread stack a drop zone placed directly inside them in a column.
    // This wrapper keeps the composer's row out of that rule; it needs no styles of its own.
    <div className='cookbook-composer-root'>
      <WithDragAndDropUpload className='cookbook-composer' component='div'>
        {!command && (
          <AttachmentSelector attachmentSelectorActionSet={attachmentActions} />
        )}
        <div className='cookbook-composer__center'>
          <QuotedMessagePreview />
          <VoiceRecordingPreviewSlot />
          <AttachmentPreviewList />
          <LinkPreviewList />
          <div className='cookbook-composer__input'>
            {command && <CommandChip command={command} />}
            <TextareaComposer />
          </div>
          <AlsoSendInChannel />
        </div>
        <MessageComposerActions />
      </WithDragAndDropUpload>
    </div>
  );
};
