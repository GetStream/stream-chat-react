import { variantMap } from './variants';
import './variants.css';

export { CustomSystemMessage } from './system-message-variants';
export { CustomAttachmentActions } from './attachment-actions-variant';
export { customReactionOptionsUpvote, SegmentedReactionsList } from './reaction-variants';

export const customReactionOptions = [
  { name: 'Thumbs up', type: '+1', Component: () => <>👍</> },
  { name: 'Thumbs down', type: '-1', Component: () => <>👎</> },
];

export const getMessageUiVariant = () => {
  const variant = new URLSearchParams(window.location.search).get('message_ui');
  return variant && variant in variantMap ? variant : null;
};

export const getMessageUiComponent = (variant: string) => {
  return variantMap[variant] ?? null;
};

export const getSystemMessageVariant = () => {
  return new URLSearchParams(window.location.search).get('system_message');
};

export const getReactionsVariant = () => {
  return new URLSearchParams(window.location.search).get('reactions');
};

export const getAttachmentActionsVariant = () => {
  return new URLSearchParams(window.location.search).get('attachment_actions');
};
