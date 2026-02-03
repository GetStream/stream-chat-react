import React from 'react';

import {
  AttachmentSelector as DefaultAttachmentSelector,
  SimpleAttachmentSelector,
} from './AttachmentSelector/AttachmentSelector';
import { AttachmentPreviewList as DefaultAttachmentPreviewList } from './AttachmentPreviewList';
import { AudioRecorder as DefaultAudioRecorder } from '../MediaRecorder';
import { QuotedMessagePreview as DefaultQuotedMessagePreview } from './QuotedMessagePreview';
import { LinkPreviewList as DefaultLinkPreviewList } from './LinkPreviewList';
import { SendToChannelCheckbox as DefaultSendToChannelCheckbox } from './SendToChannelCheckbox';
import { TextareaComposer as DefaultTextareaComposer } from '../TextareaComposer';
import { useMessageInputContext } from '../../context/MessageInputContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useMessageContext } from '../../context';
import { WithDragAndDropUpload } from './WithDragAndDropUpload';
import {
  AdditionalMessageComposerActions as DefaultAdditionalMessageComposerActions,
  MessageComposerActions,
} from './MessageComposerActions';
import { useMessageComposer } from './hooks';
import { useStateStore } from '../../store';
import {
  type AttachmentManagerState,
  LinkPreviewsManager,
  type LinkPreviewsManagerState,
  type MessageComposerState,
} from 'stream-chat';

const messageComposerStateSelector = ({ quotedMessage }: MessageComposerState) => ({
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

const MessageComposerPreviews = () => {
  const {
    AttachmentPreviewList = DefaultAttachmentPreviewList,
    LinkPreviewList = DefaultLinkPreviewList,
    QuotedMessagePreview = DefaultQuotedMessagePreview,
  } = useComponentContext();

  const messageComposer = useMessageComposer();
  const { quotedMessage } = useStateStore(
    messageComposer.state,
    messageComposerStateSelector,
  );

  const { attachments } = useStateStore(
    messageComposer.attachmentManager.state,
    attachmentManagerStateSelector,
  );

  const { linkPreviewsManager } = messageComposer;
  const { linkPreviews } = useStateStore(
    linkPreviewsManager.state,
    linkPreviewsManagerStateSelector,
  );

  if (!quotedMessage && attachments.length === 0 && linkPreviews.length === 0)
    return null;

  // todo: pass the entity arrays from here so that the preview lists do not have to subscribe to the composer state changes too?
  return (
    <div className='str-chat__message-composer-previews'>
      <QuotedMessagePreview />
      <AttachmentPreviewList />
      <LinkPreviewList />
    </div>
  );
};

export const MessageInputFlat = () => {
  const { message } = useMessageContext();
  const { recordingController } = useMessageInputContext();

  const {
    AdditionalMessageComposerActions = DefaultAdditionalMessageComposerActions,
    AttachmentSelector = message ? SimpleAttachmentSelector : DefaultAttachmentSelector,
    AudioRecorder = DefaultAudioRecorder,
    SendToChannelCheckbox = DefaultSendToChannelCheckbox,
    TextareaComposer = DefaultTextareaComposer,
  } = useComponentContext();

  if (recordingController.recordingState) return <AudioRecorder />;

  return (
    <WithDragAndDropUpload className='str-chat__message-composer' component='div'>
      <AttachmentSelector />
      <div className='str-chat__message-composer-compose-area'>
        <MessageComposerPreviews />
        <div className='str-chat__message-composer-controls'>
          <TextareaComposer />
          <AdditionalMessageComposerActions />
          <MessageComposerActions />
        </div>
      </div>
      <SendToChannelCheckbox />
    </WithDragAndDropUpload>
  );
};
