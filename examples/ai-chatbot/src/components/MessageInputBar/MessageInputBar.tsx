'use client';

import { AIMessageComposer } from '@stream-io/chat-react-ai';
import { useState, useEffect } from 'react';
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
import { startAiAgent, summarizeConversation } from '@/components/api';
import {
  checkRateLimit,
  recordMessage,
  formatTimeRemaining,
} from '@/components/rateLimitUtils';
import './MessageInputBar.scss';

const isWatchedByAI = (channel: Channel) => {
  return Object.keys(channel.state.watchers).some((watcher) =>
    watcher.startsWith('ai-bot'),
  );
};

const availableModels = [
  { platform: 'openai', value: 'gpt-4o-mini', label: 'GPT-4o mini' },
  { platform: 'openai', value: 'gpt-4o', label: 'GPT-4o' },
  { platform: 'gemini', value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
] as const;

export const MessageInputBar = () => {
  const { client } = useChatContext();
  const { updateMessage, sendMessage } = useChannelActionContext();
  const { channel } = useChannelStateContext();
  const composer = useMessageComposer();

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
    <div className="ai-demo-message-input-bar">
      {rateLimitState.isLimited && rateLimitState.resetTime && (
        <div className="ai-demo-rate-limit-message">
          <span className="material-symbols-rounded">info</span>
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

          composer.textComposer.setText(message as string);

          const composedData = await composer.compose();

          if (!composedData) return;

          target.reset();
          composer.clear();

          updateMessage(composedData?.localMessage);

          if (!channel.initialized) {
            await channel.watch();
          }

          const [platform, model] = (platformModel as string).split('|');

          if (!isWatchedByAI(channel)) {
            await startAiAgent(channel, model, platform);
          }

          await sendMessage(composedData);

          // Record message after successful send
          recordMessage(channel.id!);

          // Update rate limit state
          const newState = checkRateLimit(channel.id!);
          setRateLimitState(newState);

          if (
            typeof channel.data?.summary !== 'string' ||
            !channel.data.summary.length
          ) {
            const summary = await summarizeConversation(
              message as string,
            ).catch(() => {
              console.warn('Failed to summarize conversation');
              return null;
            });

            if (typeof summary === 'string' && summary.length > 0) {
              await channel.update({ summary });
            }
          }
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
            <AIMessageComposer.ModelSelect
              name="platform-model"
              value={selectedPlatformModel}
              options={
                <>
                  {availableModels.map((model) => (
                    <option
                      key={model.value}
                      value={`${model.platform}|${model.value}`}
                    >
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
