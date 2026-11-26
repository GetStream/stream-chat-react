import { MessageComposer, type MessageComposerProps } from 'stream-chat-react';
import { useAppSettingsSelector } from './AppSettings/state';

/**
 * `<MessageComposer/>` with the voice recording and textarea rows props from Settings -> Composer,
 * so every composer in the app behaves the same way. Props passed here win over the settings.
 */
export const ConfigurableMessageComposer = (props: MessageComposerProps) => {
  const { asyncMessagesMultiSendEnabled, audioRecordingEnabled, maxRows, minRows } =
    useAppSettingsSelector((state) => state.composer);

  return (
    <MessageComposer
      asyncMessagesMultiSendEnabled={asyncMessagesMultiSendEnabled}
      audioRecordingEnabled={audioRecordingEnabled}
      maxRows={maxRows}
      minRows={minRows}
      {...props}
    />
  );
};
