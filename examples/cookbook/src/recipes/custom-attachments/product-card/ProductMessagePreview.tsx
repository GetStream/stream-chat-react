import type { SummarizedMessagePreviewProps } from 'stream-chat-react';
import { SummarizedMessagePreview, useLatestMessagePreview } from 'stream-chat-react';
import { describeProduct, findProductAttachment } from './product';
import './ProductMessagePreview.css';

export const ProductMessagePreview = (props: SummarizedMessagePreviewProps) => {
  // The sender prefix the default preview shows: "You", or the sender's name in a group.
  const { senderName } = useLatestMessagePreview(props);
  const product = props.latestMessage && findProductAttachment(props.latestMessage);

  if (!product) return <SummarizedMessagePreview {...props} />;

  return (
    <div className='cookbook-product-message-preview'>
      {senderName && (
        <span className='cookbook-product-message-preview__sender'>{senderName}:</span>
      )}
      <span className='cookbook-product-message-preview__text'>
        {describeProduct(product)}
      </span>
    </div>
  );
};
