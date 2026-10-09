'use client';

import { useChatContext } from 'stream-chat-react';
import { useActiveChannel } from '@/components/ActiveChannelContext';
import { createDraftConversation } from '@/components/createDraftConversation';
import './SidebarHeader.scss';

export const SidebarHeader = () => {
  const { client } = useChatContext();
  const { setActiveChannel } = useActiveChannel();

  const handleNewChat = () => {
    // Check if there's unsent text in the composer
    // We'll check the text input element directly
    const textInput = document.querySelector<HTMLInputElement>(
      '.str-chat__ai-message-composer__text-input',
    );
    const hasUnsentText = textInput?.value?.trim();

    if (hasUnsentText) {
      const confirmed = window.confirm(
        'You have unsent text. Are you sure you want to start a new chat?',
      );
      if (!confirmed) return;
    }

    setActiveChannel(createDraftConversation(client));
  };

  return (
    <div className='ai-demo-sidebar-header'>
      <button
        className='ai-demo-sidebar-header__new-chat-btn'
        onClick={handleNewChat}
        type='button'
      >
        <span className='material-symbols-rounded'>add</span>
        <span>New chat</span>
      </button>
    </div>
  );
};
