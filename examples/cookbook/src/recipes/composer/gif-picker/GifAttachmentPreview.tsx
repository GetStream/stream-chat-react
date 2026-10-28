import { isGiphyAttachment } from 'stream-chat';
import type { UnsupportedAttachmentPreviewProps } from 'stream-chat-react';
import {
  AttachmentPreviewList,
  RemoveAttachmentPreviewButton,
  UnsupportedAttachmentPreview,
} from 'stream-chat-react';
import './GifAttachmentPreview.css';

const GifOrUnsupportedPreview = (props: UnsupportedAttachmentPreviewProps) => {
  const { attachment, removeAttachments } = props;

  if (!isGiphyAttachment(attachment)) {
    return <UnsupportedAttachmentPreview {...props} />;
  }

  return (
    <div className='cookbook-gif-preview'>
      <img
        alt={attachment.title || 'GIF'}
        className='cookbook-gif-preview__image'
        src={attachment.thumb_url}
      />
      <span className='cookbook-gif-preview__badge'>GIF</span>
      <RemoveAttachmentPreviewButton
        aria-label='Remove GIF'
        onClick={() => removeAttachments([attachment.localMetadata.id])}
      />
    </div>
  );
};

export const GifAttachmentPreviewList = () => (
  <AttachmentPreviewList UnsupportedAttachmentPreview={GifOrUnsupportedPreview} />
);
