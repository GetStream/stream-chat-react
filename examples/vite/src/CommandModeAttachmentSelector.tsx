import { useMemo } from 'react';
import type { TextComposerState } from 'stream-chat';
import {
  type AttachmentSelectorProps,
  AttachmentSelector as DefaultAttachmentSelector,
  defaultAttachmentSelectorActionSet,
  useMessageComposerController,
  useStateStore,
} from 'stream-chat-react';

import { useAppSettingsSelector } from './AppSettings';
import { withEventInviteAction } from './EventInvite';

const textComposerCommandSelector = ({ command }: TextComposerState) => ({ command });

export const CommandModeAttachmentSelector = (props: AttachmentSelectorProps) => {
  const messageComposer = useMessageComposerController();
  const { command } = useStateStore(
    messageComposer.textComposer.state,
    textComposerCommandSelector,
  );
  const { disabledPreviewSections, eventInvites } = useAppSettingsSelector(
    (state) => state.composer,
  );
  const filesDisabled = disabledPreviewSections.includes('attachments');
  const attachmentSelectorActionSet = useMemo(() => {
    const actionSet =
      props.attachmentSelectorActionSet ?? defaultAttachmentSelectorActionSet;
    // A composer without the Files preview offers no File option, and no Event option either,
    // since that preview is where the invite shows. Polls and location are gated through the
    // composer config instead (see the setup function in App.tsx), which the SDK's own selector
    // filter already reads.
    if (filesDisabled) return actionSet.filter(({ type }) => type !== 'uploadFile');
    return eventInvites ? withEventInviteAction(actionSet) : actionSet;
  }, [eventInvites, filesDisabled, props.attachmentSelectorActionSet]);

  return (
    <DefaultAttachmentSelector
      {...props}
      attachmentSelectorActionSet={attachmentSelectorActionSet}
      // In command mode, keyboard flow should stay in command controls + textarea.
      // Removing the attachment trigger from tab order avoids an irrelevant stop.
      // Spread any incoming buttonProps first so ARIA/data props aren't dropped when this override
      // is wired globally via WithComponents.
      buttonProps={{ ...props.buttonProps, tabIndex: command ? -1 : undefined }}
    />
  );
};
