import React from 'react';
import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useMessageInputState } from '../useMessageInputState';
import {
  generateAudioAttachment,
  generateFileAttachment,
  generateImageAttachment,
  generateLocalFileUploadAttachmentData,
  generateLocalImageUploadAttachmentData,
  generateMessage,
  generateScrapedDataAttachment,
  generateUser,
  generateVideoAttachment,
  generateVoiceRecordingAttachment,
  initClientWithChannels,
} from '../../../../mock-builders';
import { ChannelActionProvider, ChannelStateProvider, ChatProvider } from '../../../../context';

const linkPreviewAttachments = Array.from({ length: 3 }, generateScrapedDataAttachment);
const fileAttachment = generateFileAttachment();
const imageAttachment = generateImageAttachment();
const audioAttachment = generateAudioAttachment();
const videoAttachment = generateVideoAttachment();
const voiceRecordingAttachment = generateVoiceRecordingAttachment();
const message = generateMessage({
  attachments: [
    imageAttachment,
    fileAttachment,
    audioAttachment,
    videoAttachment,
    voiceRecordingAttachment,
    ...linkPreviewAttachments,
  ],
  mentioned_users: [generateUser()],
  text: 'test text',
});

window.URL = { revokeObjectURL: jest.fn() };

async function renderUseMessageInputStateHook({ channel, chatContext, client, props } = {}) {
  const {
    channels: [defaultChannel],
    client: defaultClient,
  } = await initClientWithChannels();

  const wrapper = ({ children }) => (
    <ChatProvider value={{ client: client ?? defaultClient, ...chatContext }}>
      <ChannelActionProvider value={{ addNotification: jest.fn() }}>
        <ChannelStateProvider value={{ channel: channel ?? defaultChannel }}>
          {children}
        </ChannelStateProvider>
      </ChannelActionProvider>
    </ChatProvider>
  );
  return renderHook(() => useMessageInputState(props ?? {}), { wrapper });
}
describe('useMessageInputState', () => {
  afterEach(jest.resetAllMocks);

  it('initiates an empty state', async () => {
    const {
      result: { current },
    } = await renderUseMessageInputStateHook();
    expect(current.attachments).toHaveLength(0);
    expect(current.linkPreviews.size).toBe(0);
    expect(current.mentioned_users).toHaveLength(0);
    expect(current.text).toBe('');
  });

  it('initiates the state from provided message', async () => {
    const {
      result: { current },
    } = await renderUseMessageInputStateHook({ props: { message } });
    const attachmentsLength = message.attachments.length - linkPreviewAttachments.length;
    expect(current.attachments).toHaveLength(attachmentsLength);

    current.attachments.slice(attachmentsLength).forEach((attachment, i) => {
      expect(attachment).toMatchObject(
        expect.objectContaining({
          localMetadata: {
            id: expect.any(String),
          },
          ...message.attachments[i],
        }),
      );
    });
    expect(current.linkPreviews.size).toBe(linkPreviewAttachments.length);
    expect(current.mentioned_users).toHaveLength(message.mentioned_users.length);
    expect(current.text).toBe(message.text);
  });

  describe('useAttachments', () => {
    describe('upsert attachments', () => {
      it('does not change current attachment state if no attachments provided', async () => {
        const { result } = await renderUseMessageInputStateHook();
        result.current.upsertAttachments([]);
        expect(result.current.attachments).toHaveLength(0);
      });
      it('adds new attachments', async () => {
        const { result } = await renderUseMessageInputStateHook();
        await act(() => {
          result.current.upsertAttachments(message.attachments);
        });
        expect(result.current.attachments).toHaveLength(message.attachments.length);
        result.current.attachments.forEach((resultAttachment, i) => {
          expect(resultAttachment).toMatchObject(
            expect.objectContaining({
              localMetadata: expect.objectContaining({ id: expect.any(String) }),
              ...message.attachments[i],
            }),
          );
        });
      });
      it('updates existing attachments', async () => {
        const { result } = await renderUseMessageInputStateHook({ props: { message } });
        const updatedAttachments = result.current.attachments
          .slice(3)
          .map((att) => ({ ...att, extra: 'extra' }));
        const addedAttachments = [generateImageAttachment()];
        updatedAttachments.push(...addedAttachments);
        const attachmentsAfterUpdate = [
          ...result.current.attachments.slice(0, 3),
          ...updatedAttachments,
        ];

        await act(() => {
          result.current.upsertAttachments(updatedAttachments);
        });

        expect(result.current.attachments).toHaveLength(attachmentsAfterUpdate.length);
        result.current.attachments.forEach((resultAttachment, i) => {
          expect(resultAttachment).toMatchObject(
            expect.objectContaining({
              localMetadata: expect.objectContaining({ id: expect.any(String) }),
              ...attachmentsAfterUpdate[i],
            }),
          );
        });
      });
    });
    describe('remove attachment', () => {
      it('removes existing attachments', async () => {
        const removeUpToIndex = 3;
        const { result } = await renderUseMessageInputStateHook({ props: { message } });
        const originalCount = result.current.attachments.length;
        await act(() => {
          result.current.removeAttachments(
            result.current.attachments
              .slice(0, removeUpToIndex)
              .map(({ localMetadata: { id } }) => id),
          );
        });
        const attachmentsLeft = result.current.attachments.slice(removeUpToIndex);

        expect(result.current.attachments).toHaveLength(originalCount - removeUpToIndex);

        result.current.attachments.forEach((resultAttachment, i) => {
          expect(resultAttachment).toMatchObject(
            expect.objectContaining({
              localMetadata: expect.objectContaining({ id: expect.any(String) }),
              ...attachmentsLeft[i],
            }),
          );
        });
      });
      it('keeps the original attachment state if attachment not found', async () => {
        const { result } = await renderUseMessageInputStateHook({ props: { message } });
        const originalAttachments = result.current.attachments;

        await act(() => {
          result.current.removeAttachments(
            Array.from({ length: 3 }, () => new Date().toISOString()),
          );
        });

        const attachmentsAfterRemoval = result.current.attachments;
        expect(originalAttachments).toStrictEqual(attachmentsAfterRemoval);
      });
    });
    describe('upload attachment', () => {
      const customAttachment = {
        id: new Date().toISOString(),
        latitude: 456,
        longitude: 123,
        mimeType: 'text/plain',
        title: 'custom-title.txt',
        type: 'geolocation',
      };

      const generateAttachment = {
        audio: generateAudioAttachment,
        custom: () => customAttachment,
        file: generateFileAttachment,
        image: generateImageAttachment,
        video: generateVideoAttachment,
        voiceRecording: generateVoiceRecordingAttachment,
      };

      describe.each([['audio'], ['file'], ['image'], ['video'], ['voiceRecording'], ['custom']])(
        'of type %s',
        (type) => {
          const data = generateAttachment[type]();
          const fileDataOverrides = {
            file: {
              name: type === 'image' ? data.fallback : data.title,
              type:
                type === 'image' ? 'image/' + data.fallback.split('.')[1] : data.mime_type ?? '',
            },
          };
          const attachment = {
            ...(type === 'image'
              ? generateLocalImageUploadAttachmentData(fileDataOverrides)
              : generateLocalFileUploadAttachmentData(fileDataOverrides)),
            ...data,
          };
          const getAppSettings = jest.fn();

          it('does not upload attachment if file is missing', async () => {
            const {
              channels: [channel],
              client,
            } = await initClientWithChannels();
            const sendFileSpy = jest.spyOn(channel, 'sendFile').mockResolvedValue({});
            const { result } = await renderUseMessageInputStateHook({
              channel,
              chatContext: { getAppSettings },
              client,
            });
            const att = { ...attachment, localMetadata: { ...attachment.localMetadata } };
            delete att.localMetadata.file;
            await act(async () => {
              await result.current.uploadAttachment(att);
            });
            expect(sendFileSpy).not.toHaveBeenCalled();
          });

          it.each([
            [
              'not among allowed file extensions',
              {
                allowed_file_extensions: [new Date().toISOString()],
              },
            ],
            [
              'uploading file with blocked extension',
              {
                blocked_file_extensions: attachment.localMetadata.file.type?.split('/').slice(-1),
              },
            ],
            [
              'mime_type not allowed',
              {
                allowed_mime_types: [new Date().toISOString()],
              },
            ],
            [
              'uploading file with blocked mime_type',
              {
                blocked_mime_types: [attachment.localMetadata.file.type],
              },
            ],
            [
              'file exceeds allowed size',
              {
                size_limit: attachment.localMetadata.file.size - 1,
              },
            ],
          ])('does not upload attachment if %s in app config', async (_, appConfig) => {
            getAppSettings.mockReturnValueOnce({
              app: {
                [type === 'image' ? 'image_upload_config' : 'file_upload_config']: appConfig,
              },
            });
            const {
              channels: [channel],
              client,
            } = await initClientWithChannels();
            const originalConsoleError = console.error;
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
              if (args[0].message.match('Missing permissions to upload the attachment')) return;
              originalConsoleError(...args);
            });
            const sendFileSpy = jest.spyOn(channel, 'sendFile').mockResolvedValue({});
            const { result } = await renderUseMessageInputStateHook({
              channel,
              chatContext: { getAppSettings },
              client,
            });
            await act(async () => {
              await result.current.uploadAttachment(attachment);
            });
            expect(sendFileSpy).not.toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
          });

          it('marks attachment as being uploaded', async () => {
            const assetUrl = 'asset-url';
            const {
              channels: [channel],
              client,
            } = await initClientWithChannels();
            jest
              .spyOn(channel, type === 'image' ? 'sendImage' : 'sendFile')
              .mockResolvedValue({ file: assetUrl });
            const { result } = await renderUseMessageInputStateHook({
              channel,
              chatContext: { getAppSettings },
              client,
            });
            if (type === 'image') {
              expect(attachment.localMetadata.previewUri).toBeDefined();
            }

            await act(async () => {
              await result.current.uploadAttachment(attachment);
            });

            expect(result.all).toHaveLength(3);
            expect(result.all[0].attachments).toHaveLength(0);
            expect(result.all[1].attachments).toHaveLength(1);
            expect(result.all[2].attachments).toHaveLength(1);
            // cannot test result.all[1].attachments[0].localMetadata.uploadState === 'uploading'
            // as the value is getting overridden by the current result
            expect(result.all[2].attachments[0].localMetadata.uploadState).toBe('finished');

            if (type === 'image') {
              expect(result.all[2].attachments[0].image_url).toBe(assetUrl);
              expect(result.all[2].attachments[0].localMetadata.previewUri).toBeUndefined();
            } else {
              expect(result.all[2].attachments[0].asset_url).toBe(assetUrl);
            }
          });

          it('uses custom upload function', async () => {
            const {
              channels: [channel],
              client,
            } = await initClientWithChannels();
            const customSendSpy = jest.fn();
            const sendFileSpy = jest.spyOn(channel, 'sendFile').mockResolvedValue({});
            const { result } = await renderUseMessageInputStateHook({
              channel,
              chatContext: { getAppSettings },
              client,
              props: {
                [type === 'image' ? 'doImageUploadRequest' : 'doFileUploadRequest']: customSendSpy,
              },
            });
            await act(async () => {
              await result.current.uploadAttachment(attachment);
            });
            expect(sendFileSpy).not.toHaveBeenCalled();
            expect(customSendSpy).toHaveBeenCalledTimes(1);
          });

          it('removes attachment if upload response is falsy', async () => {
            const {
              channels: [channel],
              client,
            } = await initClientWithChannels();
            jest
              .spyOn(channel, type === 'image' ? 'sendImage' : 'sendFile')
              .mockResolvedValue(undefined);
            const { result } = await renderUseMessageInputStateHook({
              channel,
              chatContext: { getAppSettings },
              client,
            });

            await act(async () => {
              await result.current.uploadAttachment(attachment);
            });

            expect(result.all).toHaveLength(3);
            expect(result.all[0].attachments).toHaveLength(0);
            expect(result.all[1].attachments).toHaveLength(1);
            expect(result.all[2].attachments).toHaveLength(0);
          });

          const errMsg = 'Went wrong';
          const errMsgCustom = 'Went wrong custom';

          it('invokes custom error handler', async () => {
            const {
              channels: [channel],
              client,
            } = await initClientWithChannels();
            jest.spyOn(channel, 'sendFile').mockRejectedValue(new Error(errMsg));
            const originalConsoleError = console.error;
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
              if (args[0].message === errMsg) return;
              originalConsoleError(...args);
            });
            const customSendSpy = jest.fn();
            const sendFileSpy = jest.spyOn(channel, 'sendFile').mockResolvedValue({});
            const { result } = await renderUseMessageInputStateHook({
              channel,
              chatContext: { getAppSettings },
              client,
              props: {
                [type === 'image' ? 'doImageUploadRequest' : 'doFileUploadRequest']: customSendSpy,
              },
            });
            await act(async () => {
              await result.current.uploadAttachment(attachment);
            });
            expect(sendFileSpy).not.toHaveBeenCalled();
            expect(customSendSpy).toHaveBeenCalledTimes(1);
            consoleErrorSpy.mockRestore();
          });

          it.each([['default'], ['custom']])(
            'marks attachment as failed on upload error of %s function',
            async (scenario) => {
              const {
                channels: [channel],
                client,
              } = await initClientWithChannels();
              const customSendSpy = jest.fn().mockRejectedValue(new Error(errMsgCustom));
              jest
                .spyOn(channel, type === 'image' ? 'sendImage' : 'sendFile')
                .mockRejectedValue(new Error(errMsg));
              const originalConsoleError = console.error;
              const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
                if ([errMsg, errMsgCustom].includes(args[0].message)) return;
                originalConsoleError(...args);
              });
              const { result } = await renderUseMessageInputStateHook({
                channel,
                chatContext: { getAppSettings },
                client,
                props:
                  scenario === 'custom'
                    ? {
                        [type === 'image'
                          ? 'doImageUploadRequest'
                          : 'doFileUploadRequest']: customSendSpy,
                      }
                    : {},
              });

              await act(async () => {
                await result.current.uploadAttachment(attachment);
              });

              expect(result.current.attachments[0].localMetadata.uploadState).toBe('failed');
              expect(consoleErrorSpy.mock.calls[0][0].message).toBe(
                scenario === 'custom' ? errMsgCustom : errMsg,
              );
              consoleErrorSpy.mockRestore();
            },
          );
        },
      );
    });
  });
});
