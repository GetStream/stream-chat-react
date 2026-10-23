'use client';

import { AIMessageComposer } from 'stream-chat-react/ai-components';
import { useEffect, useState } from 'react';
import {
  type Channel,
  isImageFile,
  type LocalUploadAttachment,
  type UploadRequestFn,
} from 'stream-chat';
import {
  useAttachmentsForPreview,
  useChannel,
  useChatContext,
  useMessageComposerController,
} from 'stream-chat-react';
import { startAiAgent, summarizeConversation } from '@/components/api';
import {
  checkRateLimit,
  formatTimeRemaining,
  recordMessage,
} from '@/components/rateLimitUtils';
import './MessageInputBar.scss';

const isWatchedByAI = (channel: Channel) =>
  Object.keys(channel.state.watchers).some((watcher) => watcher.startsWith('ai-bot'));

const availableModels = [
  { platform: 'openai', value: 'gpt-5.4-mini', label: 'GPT-5.4 mini' },
  { platform: 'openai', value: 'gpt-5.4-nano', label: 'GPT-5.4 nano' },
  {
    platform: 'gemini',
    value: 'gemini-flash-latest',
    label: 'Gemini Flash (latest)',
  },
] as const;

export const MessageInputBar = () => {
  const { client } = useChatContext();
  const channel = useChannel();
  const composer = useMessageComposerController();

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

    const upload: UploadRequestFn = async (fileLike) => {
      const request = { file: fileLike as File };
      const { file, thumb_url } = isImageFile(fileLike)
        ? await client.uploadImage(request)
        : await client.uploadFile(request);

      if (!file) throw new Error('The upload succeeded but returned no file URL');

      return { file, thumb_url };
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

          composer.textComposer.setText(message as string);

          // A new conversation exists only locally until now; `Channel` no longer creates it.
          // `watch()` sends nothing for a conversation already watched and loaded. Both setup steps
          // run before `send()`, so a failure here leaves the draft untouched.
          await channel.watch();

          const [platform, model] = (platformModel as string).split('|');

          if (!isWatchedByAI(channel)) {
            await startAiAgent(channel, model, platform);
          }

          // `send()` composes the message, shows it optimistically, releases the composer and
          // reports a failed send itself (the message stays in the list marked `failed`).
          const result = await composer.send();

          // `nothing-to-send` keeps the composer's contents (e.g. an upload is still running).
          if (result === 'nothing-to-send') return;

          target.reset();

          if (result !== 'sent') return;

          // Record message after successful send
          recordMessage(channel.id!);

          // Update rate limit state
          const newState = checkRateLimit(channel.id!);
          setRateLimitState(newState);

          if (!channel.data?.custom?.summary) {
            const summary = await summarizeConversation(message as string).catch(() => {
              console.warn('Failed to summarize conversation');
              return null;
            });

            if (typeof summary === 'string' && summary.length > 0) {
              await channel.update({ data: { custom: { summary } } });
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
