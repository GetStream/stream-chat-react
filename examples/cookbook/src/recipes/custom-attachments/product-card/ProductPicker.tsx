import type {
  AttachmentSelectorAction,
  AttachmentSelectorActionProps,
  AttachmentSelectorModalContentProps,
} from 'stream-chat-react';
import {
  AttachmentSelector,
  ContextMenuButton,
  createIcon,
  defaultAttachmentSelectorActionSet,
  Prompt,
  useContextMenuContext,
  useMessageComposerController,
} from 'stream-chat-react';
import { catalogue } from './catalogue';
import type { Product } from './product';
import { formatPrice, toProductAttachment } from './product';
import './ProductPicker.css';

export const ATTACH_PRODUCT_ACTION = 'attachProduct';

const IconBag = createIcon(
  'IconBag',
  <path
    d='M4 7h12l-1 10H5L4 7Zm3 0V6a3 3 0 0 1 6 0v1'
    fill='none'
    stroke='currentColor'
    strokeLinejoin='round'
    strokeWidth='1.5'
  />,
);

/** The menu item: opens the picker in the selector's modal. */
export const AttachProductButton = ({
  openModalForAction,
}: AttachmentSelectorActionProps) => {
  const { closeMenu } = useContextMenuContext();

  return (
    <ContextMenuButton
      className='cookbook-attach-product-button'
      Icon={IconBag}
      onClick={() => {
        openModalForAction(ATTACH_PRODUCT_ACTION);
        closeMenu();
      }}
    >
      Attach product
    </ContextMenuButton>
  );
};

/** The modal's content: picking a product adds it to the composer and closes the modal. */
export const ProductPicker = ({ close }: AttachmentSelectorModalContentProps) => {
  const messageComposer = useMessageComposerController();

  return (
    <Prompt.Root className='cookbook-product-picker'>
      <Prompt.Header close={close} title='Attach a product' />
      <Prompt.Body>
        <ul className='cookbook-product-picker__list'>
          {catalogue.map((product: Product) => (
            <li key={product.id}>
              <button
                className='cookbook-product-picker__item'
                onClick={() => {
                  messageComposer.attachmentManager.upsertAttachments([
                    toProductAttachment(product),
                  ]);
                  close();
                }}
                type='button'
              >
                <img
                  alt=''
                  className='cookbook-product-picker__image'
                  src={product.imageUrl}
                />
                <span className='cookbook-product-picker__title'>{product.title}</span>
                <span className='cookbook-product-picker__price'>
                  {formatPrice(product)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Prompt.Body>
    </Prompt.Root>
  );
};

// Declared once: the selector filters its actions again whenever it gets a new list.
const attachmentSelectorActionSet: AttachmentSelectorAction[] = [
  ...defaultAttachmentSelectorActionSet,
  {
    ActionButton: AttachProductButton,
    ModalContent: ProductPicker,
    type: ATTACH_PRODUCT_ACTION,
  },
];

export const ProductAttachmentSelector = () => (
  <AttachmentSelector attachmentSelectorActionSet={attachmentSelectorActionSet} />
);
