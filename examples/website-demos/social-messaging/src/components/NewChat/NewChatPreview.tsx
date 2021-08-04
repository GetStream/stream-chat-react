import { BlankAvatar } from '../../assets/BlankAvatar';

export const NewChatPreview = () => {
  return (
    <div className='new-chat-preview'>
      <div className='new-chat-preview-avatar'>
        <BlankAvatar />
      </div>
      <span>New Chat</span>
    </div>
  );
};
