import { useChatContext } from 'stream-chat-react';
import { customAlphabet } from 'nanoid';
import './SidebarHeader.scss';

const nanoId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

export const SidebarHeader = () => {
  const { setActiveChannel, client } = useChatContext();

  const handleNewChat = () => {
    // Check if there's unsent text in the composer
    // We'll check the textarea element directly
    const textarea = document.querySelector(
      '.ai-message-composer__textarea',
    ) as HTMLTextAreaElement;
    const hasUnsentText = textarea?.value?.trim();

    if (hasUnsentText) {
      const confirmed = window.confirm(
        'You have unsent text. Are you sure you want to start a new chat?',
      );
      if (!confirmed) return;
    }

    // Create a new channel
    const newChannel = client.channel('messaging', `ai-${nanoId()}`, {
      members: [client.userID as string],
    });

    setActiveChannel(newChannel);
  };

  return (
    <div className="ai-demo-sidebar-header">
      <button
        className="ai-demo-sidebar-header__new-chat-btn"
        onClick={handleNewChat}
        type="button"
      >
        <span className="material-symbols-rounded">add</span>
        <span>New chat</span>
      </button>
    </div>
  );
};
