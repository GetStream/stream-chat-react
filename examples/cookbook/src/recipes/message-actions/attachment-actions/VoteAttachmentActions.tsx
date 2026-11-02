import type { AttachmentActionsProps } from 'stream-chat-react';
import { AttachmentActions, Button, useMessageContext } from 'stream-chat-react';
import './VoteAttachmentActions.css';

export const VoteAttachmentActions = (props: AttachmentActionsProps) => {
  const { actions, type } = props;
  const { handleReaction, message } = useMessageContext();

  if (type !== 'image') return <AttachmentActions {...props} />;

  const ownReactionTypes = new Set(
    message.own_reactions?.map((reaction) => reaction.type),
  );

  return (
    <div className='cookbook-vote-actions'>
      {actions.map((action) => (
        <Button
          appearance={action.value === 'love' ? 'solid' : 'outline'}
          aria-pressed={!!action.value && ownReactionTypes.has(action.value)}
          className='cookbook-vote-actions__button'
          key={action.value}
          onClick={(event) => {
            if (action.value) void handleReaction(action.value, event);
          }}
          size='sm'
          variant={action.value === 'love' ? 'primary' : 'secondary'}
        >
          {action.text}
        </Button>
      ))}
    </div>
  );
};
