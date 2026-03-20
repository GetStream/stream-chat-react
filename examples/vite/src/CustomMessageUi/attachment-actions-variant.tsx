import { AttachmentActions, useMessageContext } from 'stream-chat-react';
import type { AttachmentActionsProps } from 'stream-chat-react';

import './attachment-actions-variant.css';

export const CustomAttachmentActions = (props: AttachmentActionsProps) => {
  const { actions, type } = props;
  const { handleReaction } = useMessageContext();

  const handleClick = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    value?: string,
  ) => {
    try {
      if (value === 'Love') await handleReaction('love', event);
      if (value === 'Loathe') await handleReaction('angry', event);
    } catch (err) {
      console.log(err);
    }
  };

  if (type === 'image') {
    return (
      <>
        {actions.map((action) => (
          <button
            key={action.value}
            className={`action-button ${action.value === 'Love' ? 'love' : ''}`}
            onClick={(event) => handleClick(event, action.value)}
          >
            {action.value}
          </button>
        ))}
      </>
    );
  }

  return <AttachmentActions {...props} />;
};
