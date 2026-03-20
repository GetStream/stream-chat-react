import React from 'react';
import clsx from 'clsx';

import {
  AttachmentSelector as DefaultAttachmentSelector,
  SimpleAttachmentSelector,
} from './AttachmentSelector/AttachmentSelector';
import {
  AttachmentPreviewList as DefaultAttachmentPreviewList,
  VoiceRecordingPreviewSlot as DefaultVoiceRecordingPreviewSlot,
} from './AttachmentPreviewList';
import { AudioRecorder as DefaultAudioRecorder } from '../MediaRecorder';
import { EditedMessagePreview as DefaultEditedMessagePreview } from './EditedMessagePreview';
import { QuotedMessagePreview as DefaultQuotedMessagePreview } from './QuotedMessagePreview';
import { LinkPreviewList as DefaultLinkPreviewList } from './LinkPreviewList';
import { SendToChannelCheckbox as DefaultSendToChannelCheckbox } from './SendToChannelCheckbox';
import { TextareaComposer as DefaultTextareaComposer } from '../TextareaComposer';
import { useMessageComposerContext as useMessageComposerContext } from '../../context/MessageComposerContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useMessageContext } from '../../context';
import { WithDragAndDropUpload } from './WithDragAndDropUpload';
import {
  AdditionalMessageComposerActions as DefaultAdditionalMessageComposerActions,
  MessageComposerActions,
} from './MessageComposerActions';
import { useMessageComposerController } from './hooks';
import { useStateStore } from '../../store';
import {
  type AttachmentManagerState,
  LinkPreviewsManager,
  type LinkPreviewsManagerState,
  type LocationComposerState,
  type MessageComposerState,
  type TextComposerState,
} from 'stream-chat';
import { CommandChip as DefaultCommandChip } from './CommandChip';
import { GeolocationPreview } from './AttachmentPreviewList/GeolocationPreview';

const messageComposerStateSelector = ({
  editedMessage,
  quotedMessage,
}: MessageComposerState) => ({
  editedMessage,
  quotedMessage,
});

const attachmentManagerStateSelector = (state: AttachmentManagerState) => ({
  attachments: state.attachments,
});

const linkPreviewsManagerStateSelector = (state: LinkPreviewsManagerState) => ({
  linkPreviews: Array.from(state.previews.values()).filter(
    (preview) =>
      LinkPreviewsManager.previewIsLoaded(preview) ||
      LinkPreviewsManager.previewIsLoading(preview),
  ),
});

const locationComposerStateSelector = (state: LocationComposerState) => ({
  location: state.location,
});

const textComposerCommandSelector = ({ command }: TextComposerState) => ({ command });

const MessageComposerPreviews = () => {
  const {
    AttachmentPreviewList = DefaultAttachmentPreviewList,
    EditedMessagePreview = DefaultEditedMessagePreview,
    LinkPreviewList = DefaultLinkPreviewList,
    QuotedMessagePreview = DefaultQuotedMessagePreview,
    VoiceRecordingPreviewSlot = DefaultVoiceRecordingPreviewSlot,
  } = useComponentContext();

  const messageComposer = useMessageComposerController();
  const { editedMessage, quotedMessage } = useStateStore(
    messageComposer.state,
    messageComposerStateSelector,
  );

  const { attachments } = useStateStore(
    messageComposer.attachmentManager.state,
    attachmentManagerStateSelector,
  );

  const { location } = useStateStore(
    messageComposer.locationComposer.state,
    locationComposerStateSelector,
  );

  const { linkPreviewsManager } = messageComposer;
  const { linkPreviews } = useStateStore(
    linkPreviewsManager.state,
    linkPreviewsManagerStateSelector,
  );

  if (
    !quotedMessage &&
    attachments.length === 0 &&
    linkPreviews.length === 0 &&
    !location &&
    !editedMessage
  )
    return null;

  // todo: pass the entity arrays from here so that the preview lists do not have to subscribe to the composer state changes too?
  return (
    <div className='str-chat__message-composer-previews'>
      {editedMessage ? (
        <div className='str-chat__message-composer-previews'>
          <EditedMessagePreview
            message={editedMessage}
            onCancel={() => {
              messageComposer.clear();
            }}
          />
        </div>
      ) : (
        <QuotedMessagePreview />
      )}
      <VoiceRecordingPreviewSlot />
      <AttachmentPreviewList />
      <LinkPreviewList />
      {location && (
        <GeolocationPreview
          location={location}
          // It is not possible to nullify shared_location field so we do not show a preview when editing
          // to prevent a user from wanting to remove the location
          remove={
            messageComposer.editedMessage
              ? undefined
              : messageComposer.locationComposer.initState
          }
        />
      )}
    </div>
  );
};

export const MessageComposerUI = () => {
  const { message } = useMessageContext();
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
                    <div className='str-chat__message-composer-controls__text-composition-controls__command-chip-container'>
                      <CommandChip />
                    </div>
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
