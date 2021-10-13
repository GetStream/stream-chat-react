import React from 'react';

import {
  CloseChatButton,
  SidebarDMButton,
  SidebarEventButton,
  SidebarHomeButton,
  SidebarQAButton,
  SidebarRoomButton,
} from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

type Props = {
  dmUnread: boolean;
  eventUnread: boolean;
  globalUnread: boolean;
  qaUnread: boolean;
};

export const ChatSidebar: React.FC<Props> = (props) => {
  const { dmUnread, eventUnread, globalUnread, qaUnread } = props;

  const { chatType, eventName } = useEventContext();

  const isMainEvent = eventName === 'cybersecurity' || eventName === 'data';

  return (
    <div className='chat-sidebar'>
      <CloseChatButton />
      <SidebarHomeButton globalUnread={globalUnread} />
      {(chatType === 'main-event' || eventName) && isMainEvent && (
        <SidebarEventButton eventUnread={eventUnread} />
      )}
      {(chatType === 'room' || eventName) && !isMainEvent && (
        <SidebarRoomButton eventUnread={eventUnread} />
      )}
      <SidebarDMButton dmUnread={dmUnread} />
      <SidebarQAButton qaUnread={qaUnread} />
    </div>
  );
};
