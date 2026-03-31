import React from 'react';
import { renderHook } from '@testing-library/react';
import type { LocalMessage, StreamChat } from 'stream-chat';
import {
  type LatestMessagePreviewData,
  useLatestMessagePreview,
} from '../hooks/useLatestMessagePreview';
import { MessageDeliveryStatus } from '../../ChannelListItem';
import { ChatContext, TranslationContext } from '../../../context';
import {
  generateFileAttachment,
  generateGiphyAttachment,
  generateImageAttachment,
  generateMessage,
  generateScrapedImageAttachment,
  generateUser,
  generateVideoAttachment,
  generateVoiceRecordingAttachment,
  getTestClientWithUser,
  mockChatContext,
  mockTranslationContextValue,
} from '../../../mock-builders';
import { generateStaticLocationResponse } from '../../../mock-builders/generator/sharedLocation';
import { generatePoll } from '../../../mock-builders/generator/poll';

const ownUser = generateUser({ id: 'own-user' });
const otherUser = generateUser({ id: 'other-user', name: 'Other User' });

let client: StreamChat;

const renderPreviewHook = ({
  latestMessage,
  messageDeliveryStatus,
  participantCount,
}: {
  latestMessage?: LocalMessage;
  messageDeliveryStatus?: MessageDeliveryStatus;
  participantCount?: number;
}) => {
  const wrapper = ({ children }: { children?: React.ReactNode }) => (
    <ChatContext.Provider value={mockChatContext({ client })}>
      <TranslationContext.Provider value={mockTranslationContextValue()}>
        {children}
      </TranslationContext.Provider>
    </ChatContext.Provider>
  );

  return renderHook(
    () =>
      useLatestMessagePreview({
        latestMessage,
        messageDeliveryStatus,
        participantCount,
      }),
    { wrapper },
  );
};

beforeAll(async () => {
  client = await getTestClientWithUser(ownUser);
});

describe('useLatestMessagePreview', () => {
  describe('empty / no message', () => {
    it('returns empty type when no message is provided', () => {
      const { result } = renderPreviewHook({});
      expect(result.current).toEqual<LatestMessagePreviewData>({
        text: 'Nothing yet...',
        type: 'empty',
      });
    });
  });

  describe('error / failed message', () => {
    it('returns error type for failed message', () => {
      const message = generateMessage({ status: 'failed', user: ownUser });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('error');
      expect(result.current.text).toBe('Message failed to send');
    });

    it('returns error type for error-type message', () => {
      const message = generateMessage({ type: 'error', user: ownUser });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('error');
    });
  });

  describe('delivery status', () => {
    it('uses messageDeliveryStatus when provided for own message', () => {
      const message = generateMessage({ user: ownUser });
      const { result } = renderPreviewHook({
        latestMessage: message,
        messageDeliveryStatus: MessageDeliveryStatus.READ,
      });
      expect(result.current.deliveryStatus).toBe('read');
    });

    it('falls back to message status when messageDeliveryStatus is not provided', () => {
      const message = generateMessage({ status: 'sending', user: ownUser });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.deliveryStatus).toBe('sending');
    });

    it('does not set delivery status for other users messages', () => {
      const message = generateMessage({ user: otherUser });
      const { result } = renderPreviewHook({
        latestMessage: message,
        messageDeliveryStatus: MessageDeliveryStatus.DELIVERED,
      });
      expect(result.current.deliveryStatus).toBeUndefined();
    });
  });

  describe('sender name', () => {
    it('sets senderName to "You" for own messages', () => {
      const message = generateMessage({ user: ownUser });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.senderName).toBe('You');
    });

    it('sets senderName to user name for other user in group channels', () => {
      const message = generateMessage({ user: otherUser });
      const { result } = renderPreviewHook({
        latestMessage: message,
        participantCount: 3,
      });
      expect(result.current.senderName).toBe('Other User');
    });

    it('falls back to user id when name is not available in group channels', () => {
      const noNameUser = generateUser({ id: 'no-name-user', name: undefined });
      const message = generateMessage({ user: noNameUser });
      const { result } = renderPreviewHook({
        latestMessage: message,
        participantCount: 3,
      });
      expect(result.current.senderName).toBe('no-name-user');
    });

    it('does not set senderName for other user in DM (2 participants)', () => {
      const message = generateMessage({ user: otherUser });
      const { result } = renderPreviewHook({
        latestMessage: message,
        participantCount: 2,
      });
      expect(result.current.senderName).toBeUndefined();
    });

    it('does not set senderName for other user when participantCount defaults to Infinity', () => {
      // default participantCount is Infinity, which is > 2, so senderName should be set
      const message = generateMessage({ user: otherUser });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.senderName).toBe('Other User');
    });
  });

  describe('deleted message', () => {
    it('returns deleted type with delivery status and sender name', () => {
      const message = generateMessage({
        deleted_at: new Date().toISOString(),
        user: ownUser,
      });
      const { result } = renderPreviewHook({
        latestMessage: message,
        messageDeliveryStatus: MessageDeliveryStatus.DELIVERED,
      });
      expect(result.current.type).toBe('deleted');
      expect(result.current.text).toBe('Message deleted');
      expect(result.current.deliveryStatus).toBe('delivered');
      expect(result.current.senderName).toBe('You');
    });
  });

  describe('poll message', () => {
    it('returns poll type', () => {
      const message = generateMessage({
        poll: generatePoll(),
        user: otherUser,
      });
      const { result } = renderPreviewHook({
        latestMessage: message,
        participantCount: 3,
      });
      expect(result.current.type).toBe('poll');
      expect(result.current.text).toBe('Poll');
      expect(result.current.senderName).toBe('Other User');
    });
  });

  describe('shared location message', () => {
    it('returns location type with fallback text', () => {
      const message = generateMessage({
        shared_location: generateStaticLocationResponse({}),
        text: '',
        user: ownUser,
      });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('location');
      expect(result.current.text).toBe('Location');
    });

    it('returns location type with message text when available', () => {
      const message = generateMessage({
        shared_location: generateStaticLocationResponse({}),
        text: 'Meet me here',
        user: ownUser,
      });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('location');
      expect(result.current.text).toBe('Meet me here');
    });
  });

  describe('attachment messages', () => {
    it('returns giphy type with "Giphy" text', () => {
      const message = generateMessage({
        attachments: [generateGiphyAttachment({ title: 'Funny gif' })],
        user: ownUser,
      });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('giphy');
      expect(result.current.text).toBe('GIPHY Funny gif');
    });

    it('returns image type for image attachment', () => {
      const message = generateMessage({
        attachments: [generateImageAttachment({ fallback: 'photo.png' })],
        text: '',
        user: ownUser,
      });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('image');
      expect(result.current.text).toBe('photo.png');
    });

    it('returns video type for video attachment', () => {
      const message = generateMessage({
        attachments: [generateVideoAttachment({ title: 'clip.mp4' })],
        text: '',
        user: ownUser,
      });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('video');
      expect(result.current.text).toBe('clip.mp4');
    });

    it('returns voice type for voice recording attachment', () => {
      const message = generateMessage({
        attachments: [generateVoiceRecordingAttachment()],
        text: '',
        user: ownUser,
      });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('voice');
    });

    it('returns file type for file attachment', () => {
      const message = generateMessage({
        attachments: [generateFileAttachment({ title: 'report.pdf' })],
        text: '',
        user: ownUser,
      });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('file');
      expect(result.current.text).toBe('report.pdf');
    });

    it('returns link type for scraped image attachment', () => {
      const message = generateMessage({
        attachments: [generateScrapedImageAttachment()],
        text: '',
        user: ownUser,
      });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('link');
    });

    it('prioritizes message text content over attachment fallback', () => {
      const message = generateMessage({
        attachments: [generateImageAttachment({ fallback: 'photo.png' })],
        text: 'Check this out',
        user: ownUser,
      });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('image');
      expect(result.current.text).toBe('Check this out');
    });

    it('uses generic fallback text for multiple attachments of the same type', () => {
      const message = generateMessage({
        attachments: [generateImageAttachment(), generateImageAttachment()],
        text: '',
        user: ownUser,
      });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('image');
      expect(result.current.text).toBe('imageCount');
    });

    it('uses file type for mixed attachment types', () => {
      const message = generateMessage({
        attachments: [generateImageAttachment(), generateVideoAttachment()],
        text: '',
        user: ownUser,
      });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('file');
      expect(result.current.text).toBe('fileCount');
    });

    it('appends duration for single audio/video attachment', () => {
      const message = generateMessage({
        attachments: [generateVideoAttachment({ duration: 125, title: 'clip.mp4' })],
        text: '',
        user: ownUser,
      });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.text).toBe('clip.mp4 (2:05)');
    });

    it('appends duration for voice recording', () => {
      const message = generateMessage({
        attachments: [generateVoiceRecordingAttachment({ duration: 63.5 })],
        text: '',
        user: ownUser,
      });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('voice');
      // voice recordings use generic fallback (voiceMessageCount) since fallback text is not useful
      expect(result.current.text).toBe('voiceMessageCount (1:04)');
    });

    it('formats zero-second duration correctly', () => {
      const message = generateMessage({
        attachments: [generateVideoAttachment({ duration: 0, title: 'clip.mp4' })],
        text: '',
        user: ownUser,
      });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.text).toBe('clip.mp4 (0:00)');
    });
  });

  describe('text message', () => {
    it('returns text type with message text', () => {
      const message = generateMessage({ text: 'Hello world', user: ownUser });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('text');
      expect(result.current.text).toBe('Hello world');
    });

    it('returns translated text when i18n is available', () => {
      const message = generateMessage({
        i18n: { en_text: 'Hello in English' },
        text: 'Original text',
        user: ownUser,
      });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('text');
      expect(result.current.text).toBe('Hello in English');
    });

    it('returns empty type for message with no text and no attachments', () => {
      const message = generateMessage({ attachments: [], text: '', user: ownUser });
      const { result } = renderPreviewHook({ latestMessage: message });
      expect(result.current.type).toBe('empty');
      expect(result.current.text).toBe('Empty message...');
    });
  });
});
