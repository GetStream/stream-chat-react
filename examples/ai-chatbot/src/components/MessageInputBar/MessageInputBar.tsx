import { AIMessageComposer } from '@stream-io/chat-react-ai';
import { useEffect } from 'react';
import {
  isImageFile,
  type Channel,
  type LocalUploadAttachment,
  type UploadRequestFn,
} from 'stream-chat';
import {
  useAttachmentsForPreview,
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  useMessageComposer,
} from 'stream-chat-react';
import { startAiAgent } from '../../api.ts';
import './MessageInputBar.scss';

const isWatchedByAI = (channel: Channel) => {
  return Object.keys(channel.state.watchers).some((watcher) =>
    watcher.startsWith('ai-bot'),
  );
};

export const MessageInputBar = () => {
  const { client } = useChatContext();
  const { updateMessage, sendMessage } = useChannelActionContext();
  const { channel } = useChannelStateContext();
  const composer = useMessageComposer();

  const { attachments } = useAttachmentsForPreview();

  useEffect(() => {
    if (!composer) return;

    const upload: UploadRequestFn = (file) => {
      const f = isImageFile(file) ? client.uploadImage : client.uploadFile;

      return f.call(client, file as File);
    };

    const previousDefault = composer.attachmentManager.doDefaultUploadRequest;

    composer.attachmentManager.setCustomUploadFn(upload);

    return () => composer.attachmentManager.setCustomUploadFn(previousDefault);
  }, [client, composer]);

  return (
    <div className="ai-demo-message-input-bar">
      <AIMessageComposer
        onChange={(e) => {
          const input = e.currentTarget.elements.namedItem(
            'attachments',
          ) as HTMLInputElement | null;

          const files = input?.files ?? null;

          if (files) {
            composer.attachmentManager.uploadFiles(files);
          }
        }}
        onSubmit={async (e) => {
          const event = e;
          event.preventDefault();

          const target = event.currentTarget;

          const formData = new FormData(target);

          const message = formData.get('message');
          const model = formData.get('model');

          composer.textComposer.setText(message as string);

          const composedData = await composer.compose();

          if (!composedData) return;

          target.reset();
          composer.clear();

          updateMessage(composedData?.localMessage);

          if (!channel.initialized) {
            await channel.watch();
          }

          if (!isWatchedByAI(channel)) {
            await startAiAgent(channel, model);
          }

          await sendMessage(composedData);
        }}
      >
        <AIMessageComposer.AttachmentPreview>
          {attachments.map((attachment) => (
            <AIMessageComposer.AttachmentPreview.Item
              key={attachment.localMetadata.id}
              file={attachment.localMetadata.file as File}
              state={attachment.localMetadata.uploadState}
              imagePreviewSource={
                attachment.thumb_url ||
                (attachment.localMetadata.previewUri as string)
              }
              onDelete={() => {
                composer.attachmentManager.removeAttachments([
                  attachment.localMetadata.id,
                ]);
              }}
              onRetry={() => {
                composer.attachmentManager.uploadAttachment(
                  attachment as LocalUploadAttachment,
                );
              }}
            />
          ))}
        </AIMessageComposer.AttachmentPreview>
        <AIMessageComposer.TextInput name="message" />
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '.25rem', alignItems: 'center' }}>
            <AIMessageComposer.FileInput name="attachments" />
            <AIMessageComposer.SpeechToTextButton />
            <AIMessageComposer.ModelSelect name="model" />
          </div>

          <AIMessageComposer.SubmitButton />
        </div>
      </AIMessageComposer>
    </div>
  );
};
