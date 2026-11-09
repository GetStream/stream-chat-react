import type { PropsWithChildren } from 'react';
import type { VoiceRecordingPreviewProps } from 'stream-chat-react';
import {
  RemoveAttachmentPreviewButton,
  VoiceRecordingPreviewSlot,
  WithComponents,
} from 'stream-chat-react';
import './VoiceRecordingPreview.css';

const CompactVoiceRecordingPreview = ({
  attachment,
  removeAttachments,
}: VoiceRecordingPreviewProps) => {
  const { id, previewUri, uploadState } = attachment.localMetadata;

  return (
    <div className='cookbook-voice-preview'>
      <audio controls src={attachment.asset_url || previewUri} />
      <RemoveAttachmentPreviewButton
        onClick={() => removeAttachments([id])}
        uploadState={uploadState}
      />
    </div>
  );
};

const CustomVoiceRecordingPreviewSlot = () => (
  <VoiceRecordingPreviewSlot VoiceRecordingPreview={CompactVoiceRecordingPreview} />
);

const overrides = { VoiceRecordingPreviewSlot: CustomVoiceRecordingPreviewSlot };

export const WithVoicePreview = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
