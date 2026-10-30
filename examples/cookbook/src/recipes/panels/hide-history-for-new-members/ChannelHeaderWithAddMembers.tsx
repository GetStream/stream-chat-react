import { ChannelHeader, WorkspaceNavigationCloseButton } from 'stream-chat-react';
import { AddMembersButton } from './AddMembersButton';

/**
 * The SDK's header, with Add members before its close button. Call it once, outside any
 * component, so the header and its button keep their identity across renders.
 */
export const createChannelHeaderWithAddMembers = (memberIds: string[]) => {
  const HeaderEnd = () => (
    <>
      <AddMembersButton memberIds={memberIds} />
      <WorkspaceNavigationCloseButton />
    </>
  );

  const ChannelHeaderWithAddMembers = () => <ChannelHeader EndContent={HeaderEnd} />;
  return ChannelHeaderWithAddMembers;
};
