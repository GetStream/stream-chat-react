import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Attachment, Channel as ChannelType, StreamChat } from 'stream-chat';
import { LinkPreviewStatus } from 'stream-chat';

import {
  generateFileAttachment,
  generateLocalFileUploadAttachmentData,
  generateMessage,
  generatePoll,
  generateScrapedImageAttachment,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';
import { axe } from '../../../../axe-helper';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { WithComponents } from '../../../context';
import { MessageComposer } from '../MessageComposer';
import {
  MessageComposerPreviews,
  type MessageComposerPreviewSetItem,
} from '../MessageComposerPreviews';
import { defaultMessageComposerPreviewSet } from '../MessageComposerPreviews.defaults';

const PREVIEWS_CLASS = 'str-chat__message-composer-previews';

const setup = async () => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({ customUser: generateUser({ id: 'me' }) });
  return { channel, client };
};

const renderPreviews = async ({
  channel,
  client,
  previewSet,
}: {
  channel: ChannelType;
  client: StreamChat;
  previewSet?: MessageComposerPreviewSetItem[];
}) => {
  let result!: ReturnType<typeof render>;
  await act(() => {
    result = render(
      <Chat client={client}>
        <Channel channel={channel}>
          <MessageComposerPreviews messageComposerPreviewSet={previewSet} />
        </Channel>
      </Chat>,
    );
  });
  return result;
};

const addLinkPreview = (channel: ChannelType) => {
  const preview = generateScrapedImageAttachment(
    fromPartial<Partial<Attachment>>({ status: LinkPreviewStatus.LOADED }),
  );
  channel.messageComposer.linkPreviewsManager.state.next({
    previews: new Map([[preview.og_scrape_url, preview]]),
  });
};

const addFileAttachment = (channel: ChannelType) => {
  channel.messageComposer.attachmentManager.upsertAttachments([
    generateLocalFileUploadAttachmentData(
      { uploadState: 'finished' },
      generateFileAttachment(),
    ),
  ]);
};

const previewTestIds = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll(
      `.${PREVIEWS_CLASS} [data-testid='quoted-message-preview'], .${PREVIEWS_CLASS} [data-testid='attachment-preview-list'], .${PREVIEWS_CLASS} [data-testid='link-preview-card'], .${PREVIEWS_CLASS} [data-testid='location-preview'], .${PREVIEWS_CLASS} [data-testid='custom-preview']`,
    ),
  ).map((element) => element.getAttribute('data-testid'));

describe('MessageComposerPreviews', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders nothing while no preview is visible', async () => {
    const { channel, client } = await setup();
    const { container } = await renderPreviews({ channel, client });

    expect(container.querySelector(`.${PREVIEWS_CLASS}`)).not.toBeInTheDocument();
  });

  it('renders the default previews in order', async () => {
    const { channel, client } = await setup();
    const { container } = await renderPreviews({ channel, client });

    await act(() => {
      channel.messageComposer.setQuotedMessage(
        generateMessage({ text: 'quoted', user: generateUser() }),
      );
      addFileAttachment(channel);
      addLinkPreview(channel);
      channel.messageComposer.locationComposer.setData({ latitude: 1, longitude: 2 });
    });

    expect(container.querySelectorAll(`.${PREVIEWS_CLASS}`)).toHaveLength(1);
    expect(previewTestIds(container)).toEqual([
      'quoted-message-preview',
      'attachment-preview-list',
      'link-preview-card',
      'location-preview',
    ]);
  });

  it('shows the edited message instead of the quoted message', async () => {
    const { channel, client } = await setup();
    const { container } = await renderPreviews({ channel, client });

    await act(() => {
      channel.messageComposer.state.partialNext({
        editedMessage: fromPartial(
          generateMessage({ text: 'edited', user: generateUser() }),
        ),
        quotedMessage: fromPartial(generateMessage({ text: 'quoted' })),
      });
    });

    expect(screen.getByText('Edit Message')).toBeInTheDocument();
    expect(screen.queryByText('quoted')).not.toBeInTheDocument();
    expect(container.querySelector(`.${PREVIEWS_CLASS}`)).toBeInTheDocument();
  });

  it('renders a custom preview item when it is visible', async () => {
    const { channel, client } = await setup();
    const CustomPreview = () => <div data-testid='custom-preview'>Custom</div>;
    const previewSet: MessageComposerPreviewSetItem[] = [
      {
        Component: CustomPreview,
        isVisible: ({ customData }) =>
          !!(customData as Record<string, unknown>).showCustomPreview,
        type: 'custom',
      },
      ...defaultMessageComposerPreviewSet,
    ];
    const { container } = await renderPreviews({ channel, client, previewSet });

    expect(screen.queryByTestId('custom-preview')).not.toBeInTheDocument();

    await act(() => {
      channel.messageComposer.customDataManager.setCustomData(
        fromPartial({ showCustomPreview: true }),
      );
      addLinkPreview(channel);
    });

    expect(previewTestIds(container)).toEqual(['custom-preview', 'link-preview-card']);
  });

  it('removes a default preview left out of the set', async () => {
    const { channel, client } = await setup();
    const { container } = await renderPreviews({
      channel,
      client,
      previewSet: defaultMessageComposerPreviewSet.filter(
        ({ type }) => type !== 'linkPreviews',
      ),
    });

    await act(() => addLinkPreview(channel));

    expect(container.querySelector(`.${PREVIEWS_CLASS}`)).not.toBeInTheDocument();
  });

  it('is installed through the MessageComposerPreviews component slot', async () => {
    const { channel, client } = await setup();
    const CustomPreview = () => <div data-testid='custom-preview'>Custom</div>;
    const CustomPreviews = () => (
      <MessageComposerPreviews
        messageComposerPreviewSet={[
          { Component: CustomPreview, isVisible: () => true, type: 'custom' },
        ]}
      />
    );

    await act(() => {
      render(
        <Chat client={client}>
          <WithComponents overrides={{ MessageComposerPreviews: CustomPreviews }}>
            <Channel channel={channel}>
              <MessageComposer />
            </Channel>
          </WithComponents>
        </Chat>,
      );
    });

    expect(screen.getByTestId('custom-preview')).toBeInTheDocument();
  });

  it('shows no default preview for a poll the composer holds', async () => {
    const { channel, client } = await setup();
    const { container } = await renderPreviews({ channel, client });

    await act(() => {
      channel.messageComposer.state.partialNext({ pollId: generatePoll().id });
    });

    expect(container.querySelector(`.${PREVIEWS_CLASS}`)).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { channel, client } = await setup();
    const { container } = await renderPreviews({ channel, client });

    await act(() => {
      addFileAttachment(channel);
      addLinkPreview(channel);
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('lets a custom item show the poll the composer holds', async () => {
    const { channel, client } = await setup();
    const PollItem = () => <div data-testid='custom-preview'>Poll</div>;
    const previewSet: MessageComposerPreviewSetItem[] = [
      ...defaultMessageComposerPreviewSet,
      {
        Component: PollItem,
        isVisible: ({ editedMessage, pollId }) => !editedMessage && !!pollId,
        type: 'poll',
      },
    ];
    const { container } = await renderPreviews({ channel, client, previewSet });

    await act(() => {
      channel.messageComposer.state.partialNext({ pollId: generatePoll().id });
    });

    expect(previewTestIds(container)).toEqual(['custom-preview']);
  });
});
