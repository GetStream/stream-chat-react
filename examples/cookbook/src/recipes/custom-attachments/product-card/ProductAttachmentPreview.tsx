import type { UnsupportedAttachmentPreviewProps } from 'stream-chat-react';
import {
  AttachmentPreviewList,
  RemoveAttachmentPreviewButton,
  UnsupportedAttachmentPreview,
} from 'stream-chat-react';
import { formatPrice, isProductAttachment } from './product';
import './ProductAttachmentPreview.css';

const ProductOrUnsupportedPreview = (props: UnsupportedAttachmentPreviewProps) => {
  const { attachment, removeAttachments } = props;

  if (!isProductAttachment(attachment)) {
    return <UnsupportedAttachmentPreview {...props} />;
  }

  return (
    <div className='cookbook-product-preview'>
      {attachment.image_url && (
        <img
          alt=''
          className='cookbook-product-preview__image'
          src={attachment.image_url}
        />
      )}
      <div className='cookbook-product-preview__details'>
        <span className='cookbook-product-preview__title'>{attachment.title}</span>
        <span className='cookbook-product-preview__price'>
          {formatPrice(attachment.custom)}
        </span>
      </div>
      <RemoveAttachmentPreviewButton
        aria-label='Remove product'
        onClick={() => removeAttachments([attachment.localMetadata.id])}
      />
    </div>
  );
};

export const ProductAttachmentPreviewList = () => (
  <AttachmentPreviewList UnsupportedAttachmentPreview={ProductOrUnsupportedPreview} />
);
