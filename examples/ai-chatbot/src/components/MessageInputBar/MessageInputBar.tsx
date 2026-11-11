'use client';

import { AIMessageComposer } from 'stream-chat-react/ai-components';
import { useEffect, useState } from 'react';
import {
  isImageFile,
  type LocalUploadAttachment,
  type UploadRequestFn,
} from 'stream-chat';
import {
  useAttachmentsForPreview,
  useChannelStateContext,
  useChatContext,
  useMessageComposerController,
} from 'stream-chat-react';
import { checkRateLimit, formatTimeRemaining } from '@/components/rateLimitUtils';
import { availableModels, useSendAIMessage } from '@/components/useSendAIMessage';
import { VoiceModeButton } from '@/components/VoiceMode';
import './MessageInputBar.scss';

export const MessageInputBar = () => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const composer = useMessageComposerController();
  const sendAIMessage = useSendAIMessage();

  const { attachments } = useAttachmentsForPreview();
  const [selectedPlatformModel, setSelectedPlatformModel] = useState<string>();
  const [rateLimitState, setRateLimitState] = useState<{
    isLimited: boolean;
    resetTime: number | null;
    remainingMessages: number;
  }>({
    isLimited: false,
    resetTime: null,
    remainingMessages: 10,
  });

  // Check rate limit when channel changes or on mount
  useEffect(() => {
    if (!channel?.id) return;

    const updateRateLimit = () => {
      const state = checkRateLimit(channel.id!);
      setRateLimitState(state);
    };

    updateRateLimit();

    const interval = setInterval(updateRateLimit, 60000);
    return () => clearInterval(interval);
  }, [channel?.id]);

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
    <div className='ai-demo-message-input-bar'>
      {rateLimitState.isLimited && rateLimitState.resetTime && (
        <div className='ai-demo-rate-limit-message'>
          <span className='material-symbols-rounded'>info</span>
          <span>
            Limit reached, 10 messages per conversation. Resets in{' '}
            <strong>{formatTimeRemaining(rateLimitState.resetTime)}</strong>.
          </span>
        </div>
      )}
      <AIMessageComposer
        disabled={rateLimitState.isLimited}
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

          // Check rate limit before processing
          if (rateLimitState.isLimited) return;

          const target = event.currentTarget;

          const formData = new FormData(target);

          const message = formData.get('message');
          const platformModel = formData.get('platform-model');
          setSelectedPlatformModel(platformModel as string);

          const sent = await sendAIMessage({
            onComposed: () => target.reset(),
            platformModel: platformModel as string,
            text: message as string,
          });

          // Update rate limit state
          if (sent) setRateLimitState(checkRateLimit(channel.id!));
        }}
      >
        <AIMessageComposer.AttachmentPreview>
          {attachments.map((attachment) => (
            <AIMessageComposer.AttachmentPreview.Item
              key={attachment.localMetadata.id}
              file={attachment.localMetadata.file as File}
              state={attachment.localMetadata.uploadState}
              imagePreviewSource={
                attachment.thumb_url || (attachment.localMetadata.previewUri as string)
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
        <AIMessageComposer.TextInput name='message' />
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '.25rem', alignItems: 'center' }}>
            <AIMessageComposer.FileInput name='attachments' />
            <AIMessageComposer.SpeechToTextButton />
            <VoiceModeButton />
            <AIMessageComposer.ModelSelect
              name='platform-model'
              value={selectedPlatformModel}
              options={
                <>
                  {availableModels.map((model) => (
                    <option key={model.value} value={`${model.platform}|${model.value}`}>
                      {model.label}
                    </option>
                  ))}
                </>
              }
            />
          </div>

          <AIMessageComposer.SubmitButton active={attachments.length > 0} />
        </div>
      </AIMessageComposer>
    </div>
  );
};
