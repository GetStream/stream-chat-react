import type {
  Attachment,
  LocalAttachment,
  MessageComposer,
  MessageComposerMiddlewareState,
  MessageCompositionMiddleware,
  MessageDraftComposerMiddlewareValueState,
  MessageDraftCompositionMiddleware,
  MiddlewareHandlerParams,
} from 'stream-chat';
import { isProductAttachment } from './product';

export const PRODUCT_ATTACHMENTS_MIDDLEWARE_ID = 'my-app/product-attachments';
export const DRAFT_PRODUCT_ATTACHMENTS_MIDDLEWARE_ID = 'my-app/draft-product-attachments';

/** The attachment as the message carries it: without the composer's `localMetadata`. */
const toAttachment = (localAttachment: LocalAttachment) => {
  const attachment: Partial<LocalAttachment> = { ...localAttachment };
  delete attachment.localMetadata;
  return attachment as Attachment;
};

/**
 * The attachments with every product in the composer, whatever its upload state. The attachments
 * middleware adds only finished uploads, and a product loaded from a message being edited or from a
 * draft has no upload state.
 */
const withComposerProducts = (
  composer: MessageComposer,
  attachments: Attachment[] = [],
): Attachment[] | undefined => {
  const products = composer.attachmentManager.attachments
    .filter(isProductAttachment)
    .map(toAttachment);
  if (!products.length) return undefined;
  return [
    ...attachments.filter((attachment) => !isProductAttachment(attachment)),
    ...products,
  ];
};

/** Puts the composer's products into the message it sends or saves. */
export const createProductAttachmentsMiddleware = (
  composer: MessageComposer,
): MessageCompositionMiddleware => ({
  id: PRODUCT_ATTACHMENTS_MIDDLEWARE_ID,
  handlers: {
    compose: ({
      forward,
      next,
      state,
    }: MiddlewareHandlerParams<MessageComposerMiddlewareState>) => {
      const attachments = withComposerProducts(composer, state.message.attachments);
      if (!attachments) return forward();

      return next({
        ...state,
        localMessage: { ...state.localMessage, attachments },
        message: { ...state.message, attachments },
      });
    },
  },
});

/** Puts the composer's products into the draft it saves. */
export const createDraftProductAttachmentsMiddleware = (
  composer: MessageComposer,
): MessageDraftCompositionMiddleware => ({
  id: DRAFT_PRODUCT_ATTACHMENTS_MIDDLEWARE_ID,
  handlers: {
    compose: ({
      forward,
      next,
      state,
    }: MiddlewareHandlerParams<MessageDraftComposerMiddlewareValueState>) => {
      const attachments = withComposerProducts(composer, state.draft.attachments);
      if (!attachments) return forward();

      return next({ ...state, draft: { ...state.draft, attachments } });
    },
  },
});
