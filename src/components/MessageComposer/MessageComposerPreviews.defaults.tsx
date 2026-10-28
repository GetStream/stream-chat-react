/* eslint-disable sort-keys */
import React from 'react';
import {
  isLocalVoiceRecordingAttachment,
  isVoiceRecordingAttachment,
  type LocationComposerState,
  type MessageComposerState,
} from 'stream-chat';

import { useComponentContext } from '../../context/ComponentContext';
import { useStateStore } from '../../store';
import {
  AttachmentPreviewList as DefaultAttachmentPreviewList,
  VoiceRecordingPreviewSlot as DefaultVoiceRecordingPreviewSlot,
} from './AttachmentPreviewList';
import { GeolocationPreview } from './AttachmentPreviewList/GeolocationPreview';
import { EditedMessagePreview as DefaultEditedMessagePreview } from './EditedMessagePreview';
import { useMessageComposerController } from './hooks';
import { LinkPreviewList as DefaultLinkPreviewList } from './LinkPreviewList';
import type { MessageComposerPreviewSetItem } from './MessageComposerPreviews';
import { PollPreview as DefaultPollPreview } from './PollPreview';
import { restorePreEditSnapshot } from './preEditSnapshot';
import { QuotedMessagePreview as DefaultQuotedMessagePreview } from './QuotedMessagePreview';

const editedMessageSelector = ({ editedMessage }: MessageComposerState) => ({
  editedMessage,
});

const locationSelector = ({ location }: LocationComposerState) => ({ location });

const DefaultMessageComposerPreviewComponents = {
  EditedMessage() {
    const { EditedMessagePreview = DefaultEditedMessagePreview } = useComponentContext();
    const messageComposer = useMessageComposerController();
    const { editedMessage } = useStateStore(messageComposer.state, editedMessageSelector);

    if (!editedMessage) return null;

    return (
      <div className='str-chat__message-composer-previews'>
        <EditedMessagePreview
          message={editedMessage}
          onCancel={() => {
            restorePreEditSnapshot(messageComposer);
          }}
        />
      </div>
    );
  },
  QuotedMessage() {
    const { QuotedMessagePreview = DefaultQuotedMessagePreview } = useComponentContext();
    return <QuotedMessagePreview />;
  },
  VoiceRecording() {
    const { VoiceRecordingPreviewSlot = DefaultVoiceRecordingPreviewSlot } =
      useComponentContext();
    return <VoiceRecordingPreviewSlot />;
  },
  Attachments() {
    const { AttachmentPreviewList = DefaultAttachmentPreviewList } =
      useComponentContext();
    return <AttachmentPreviewList />;
  },
  LinkPreviews() {
    const { LinkPreviewList = DefaultLinkPreviewList } = useComponentContext();
    return <LinkPreviewList />;
  },
  Location() {
    const messageComposer = useMessageComposerController();
    const { location } = useStateStore(
      messageComposer.locationComposer.state,
      locationSelector,
    );
    const { editedMessage } = useStateStore(messageComposer.state, editedMessageSelector);

    if (!location) return null;

    return (
      <GeolocationPreview
        location={location}
        // `shared_location` cannot be nullified, so there is no remove action while editing.
        remove={editedMessage ? undefined : messageComposer.locationComposer.initState}
      />
    );
  },
  Poll() {
    const { PollPreview = DefaultPollPreview } = useComponentContext();
    return <PollPreview />;
  },
};

/**
 * The previews `MessageComposerPreviews` renders by default, in render order. Filter, reorder or
 * extend it and pass the result as `messageComposerPreviewSet`.
 */
export const defaultMessageComposerPreviewSet: MessageComposerPreviewSetItem[] = [
  {
    Component: DefaultMessageComposerPreviewComponents.EditedMessage,
    isVisible: ({ editedMessage }) => !!editedMessage,
    type: 'editedMessage',
  },
  {
    Component: DefaultMessageComposerPreviewComponents.QuotedMessage,
    // The edited message preview takes the quoted message's place while editing.
    isVisible: ({ editedMessage, quotedMessage }) => !editedMessage && !!quotedMessage,
    type: 'quotedMessage',
  },
  {
    Component: DefaultMessageComposerPreviewComponents.VoiceRecording,
    isVisible: ({ attachments }) => attachments.some(isLocalVoiceRecordingAttachment),
    type: 'voiceRecording',
  },
  {
    Component: DefaultMessageComposerPreviewComponents.Attachments,
    // Voice recordings render in the `voiceRecording` preview instead.
    isVisible: ({ attachments }) =>
      attachments.some((attachment) => !isVoiceRecordingAttachment(attachment)),
    type: 'attachments',
  },
  {
    Component: DefaultMessageComposerPreviewComponents.LinkPreviews,
    isVisible: ({ linkPreviews }) => linkPreviews.length > 0,
    type: 'linkPreviews',
  },
  {
    Component: DefaultMessageComposerPreviewComponents.Location,
    isVisible: ({ location }) => !!location,
    type: 'location',
  },
  {
    Component: DefaultMessageComposerPreviewComponents.Poll,
    // An edited message keeps its poll; it cannot be replaced or removed.
    isVisible: ({ editedMessage, pollId }) => !editedMessage && !!pollId,
    type: 'poll',
  },
];
