import type { Attachment, LocalAttachment } from 'stream-chat';

declare module 'stream-chat' {
  // The fields a `product` attachment keeps in its `custom`. Optional, because every attachment
  // in the app shares this interface.
  interface CustomAttachmentData {
    currency?: string;
    price?: number;
    product_url?: string;
  }
}

export const PRODUCT_ATTACHMENT_TYPE = 'product';

export type Product = {
  currency: string;
  id: string;
  imageUrl: string;
  price: number;
  title: string;
  url: string;
};

/** True for an attachment this app sends for a product. */
export const isProductAttachment = (attachment: Attachment) =>
  attachment.type === PRODUCT_ATTACHMENT_TYPE;

/** The message's first product attachment, if it has one. */
export const findProductAttachment = (message: { attachments?: Attachment[] }) =>
  message.attachments?.find(isProductAttachment);

/** The price in its currency, for example "€34.00". */
export const formatPrice = ({
  currency,
  price,
}: {
  currency?: string;
  price?: number;
}) =>
  price === undefined || !currency
    ? ''
    : new Intl.NumberFormat(undefined, { currency, style: 'currency' }).format(price);

/** One line for places that show text only, for example "🛍 Glass teapot · €34.00". */
export const describeProduct = (attachment: Attachment) =>
  [`🛍 ${attachment.title ?? 'Product'}`, formatPrice(attachment.custom)]
    .filter(Boolean)
    .join(' · ');

/**
 * The attachment the composer adds for a product. Nothing is uploaded, but the composer sends only
 * attachments whose upload state is `finished`, and the type requires a file, so it gets an empty one.
 */
export const toProductAttachment = (product: Product): LocalAttachment => ({
  custom: {
    currency: product.currency,
    price: product.price,
    product_url: product.url,
  },
  image_url: product.imageUrl,
  localMetadata: {
    file: new File([], product.id),
    id: crypto.randomUUID(),
    uploadState: 'finished',
  },
  title: product.title,
  type: PRODUCT_ATTACHMENT_TYPE,
});
