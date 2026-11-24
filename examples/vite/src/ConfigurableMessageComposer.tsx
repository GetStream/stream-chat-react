import { MessageComposer, type MessageComposerProps } from 'stream-chat-react';
import { useAppSettingsSelector } from './AppSettings/state';

/**
 * `<MessageComposer/>` with the voice recording props from Settings -> Composer, so every composer
 * in the app records and sends recordings the same way. Props passed here win over the settings.
 */
export const ConfigurableMessageComposer = (props: MessageComposerProps) => {
  const { asyncMessagesMultiSendEnabled, audioRecordingEnabled } = useAppSettingsSelector(
    (state) => state.composer,
  );

  return (
    <MessageComposer
      asyncMessagesMultiSendEnabled={asyncMessagesMultiSendEnabled}
      audioRecordingEnabled={audioRecordingEnabled}
      {...props}
    />
  );
};
