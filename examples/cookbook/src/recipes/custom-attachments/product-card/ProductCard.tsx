import type { AttachmentProps, UnsupportedAttachmentProps } from 'stream-chat-react';
import { Attachment, UnsupportedAttachment } from 'stream-chat-react';
import { formatPrice, isProductAttachment } from './product';
import './ProductCard.css';

const ProductOrUnsupported = ({ attachment }: UnsupportedAttachmentProps) => {
  if (!isProductAttachment(attachment)) return <UnsupportedAttachment />;

  const { product_url } = attachment.custom;

  return (
    <div className='cookbook-product-card'>
      {attachment.image_url && (
        <img alt='' className='cookbook-product-card__image' src={attachment.image_url} />
      )}
      <div className='cookbook-product-card__body'>
        <div className='cookbook-product-card__details'>
          <span className='cookbook-product-card__title'>{attachment.title}</span>
          <span className='cookbook-product-card__price'>
            {formatPrice(attachment.custom)}
          </span>
        </div>
        {product_url && (
          <a
            aria-label={`View ${attachment.title ?? 'product'}`}
            className='cookbook-product-card__link'
            href={product_url}
            rel='noreferrer'
            target='_blank'
          >
            View
          </a>
        )}
      </div>
    </div>
  );
};

export const ProductAttachment = (props: AttachmentProps) => (
  <Attachment {...props} UnsupportedAttachment={ProductOrUnsupported} />
);
