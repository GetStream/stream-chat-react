import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

const cachePoll = (client: StreamChat, poll = generatePoll()) => {
  client.polls.hydratePollCache([fromPartial({ poll })]);
  return poll;
};

const previewTestIds = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll(
      `.${PREVIEWS_CLASS} [data-testid='quoted-message-preview'], .${PREVIEWS_CLASS} [data-testid='attachment-preview-list'], .${PREVIEWS_CLASS} [data-testid='link-preview-card'], .${PREVIEWS_CLASS} [data-testid='location-preview'], .${PREVIEWS_CLASS} [data-testid='poll-preview'], .${PREVIEWS_CLASS} [data-testid='custom-preview']`,
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
    cachePoll(client);

    await act(() => {
      channel.messageComposer.setQuotedMessage(
        generateMessage({ text: 'quoted', user: generateUser() }),
      );
      addFileAttachment(channel);
      addLinkPreview(channel);
      channel.messageComposer.locationComposer.setData({ latitude: 1, longitude: 2 });
      channel.messageComposer.state.partialNext({ pollId: generatePoll().id });
    });

    expect(container.querySelectorAll(`.${PREVIEWS_CLASS}`)).toHaveLength(1);
    expect(previewTestIds(container)).toEqual([
      'quoted-message-preview',
      'attachment-preview-list',
      'link-preview-card',
      'location-preview',
      'poll-preview',
    ]);
  });

  it('shows the edited message instead of the quoted message and the poll', async () => {
    const { channel, client } = await setup();
    const { container } = await renderPreviews({ channel, client });

    await act(() => {
      channel.messageComposer.state.partialNext({
        editedMessage: fromPartial(
          generateMessage({ text: 'edited', user: generateUser() }),
        ),
        pollId: 'poll-id',
        quotedMessage: fromPartial(generateMessage({ text: 'quoted' })),
      });
    });

    expect(screen.getByText('Edit Message')).toBeInTheDocument();
    expect(screen.queryByText('quoted')).not.toBeInTheDocument();
    expect(screen.queryByTestId('poll-preview')).not.toBeInTheDocument();
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

  describe('poll preview', () => {
    it('renders the preview area for a poll-only composer', async () => {
      const { channel, client } = await setup();
      const poll = cachePoll(client);
      const { container } = await renderPreviews({ channel, client });

      await act(() => {
        channel.messageComposer.state.partialNext({ pollId: poll.id });
      });

      const pollPreview = screen.getByTestId('poll-preview');
      expect(container.querySelector(`.${PREVIEWS_CLASS}`)).toContainElement(pollPreview);
      expect(pollPreview).toHaveTextContent(poll.name);
      // The default generated poll: 4 options, up to 2 votes, public, comments on.
      expect(pollPreview).toHaveTextContent('4 options');
      expect(pollPreview).toHaveTextContent('A, B, C and 1 more');
      expect(
        within(screen.getByRole('list', { name: 'Poll settings' }))
          .getAllByRole('listitem')
          .map((item) => item.textContent),
      ).toEqual(['Up to 2 votes', 'Comments']);
    });

    it('names only the first options of a long poll and reflects its settings', async () => {
      const { channel, client } = await setup();
      const poll = cachePoll(
        client,
        generatePoll({
          allow_answers: false,
          allow_user_suggested_options: true,
          enforce_unique_vote: true,
          id: 'long-poll',
          options: Array.from({ length: 99 }, (_, index) => ({
            id: `option-${index}`,
            text: `Option ${index + 1}`,
          })),
          voting_visibility: 'anonymous',
        }),
      );
      await renderPreviews({ channel, client });

      await act(() => {
        channel.messageComposer.state.partialNext({ pollId: poll.id });
      });

      const pollPreview = screen.getByTestId('poll-preview');
      expect(pollPreview).toHaveTextContent('99 options');
      expect(pollPreview).toHaveTextContent('Option 1, Option 2, Option 3 and 96 more');
      expect(pollPreview).not.toHaveTextContent('Option 4');
      expect(
        within(screen.getByRole('list', { name: 'Poll settings' }))
          .getAllByRole('listitem')
          .map((item) => item.textContent),
      ).toEqual(['Anonymous', 'Others can add options']);
    });

    it('fetches a poll that is not cached', async () => {
      const { channel, client } = await setup();
      const poll = generatePoll({ id: 'uncached-poll', name: 'Fetched question' });
      const getPollSpy = vi
        .spyOn(client, 'getPoll')
        .mockResolvedValue(fromPartial({ poll }));
      await renderPreviews({ channel, client });

      await act(() => {
        channel.messageComposer.state.partialNext({ pollId: poll.id });
      });

      expect(getPollSpy).toHaveBeenCalledWith({ poll_id: poll.id });
      expect(await screen.findByText('Fetched question')).toBeInTheDocument();
    });

    it('detaches the poll from the composer on remove', async () => {
      const { channel, client } = await setup();
      const poll = cachePoll(client);
      const { container } = await renderPreviews({ channel, client });

      await act(() => {
        channel.messageComposer.state.partialNext({ pollId: poll.id });
      });
      await act(() => {
        fireEvent.click(screen.getByTestId('poll-preview-delete-button'));
      });

      expect(channel.messageComposer.pollId).toBeNull();
      expect(container.querySelector(`.${PREVIEWS_CLASS}`)).not.toBeInTheDocument();
    });

    it('has no accessibility violations', async () => {
      const { channel, client } = await setup();
      const poll = cachePoll(client);
      const { container } = await renderPreviews({ channel, client });

      await act(() => {
        channel.messageComposer.state.partialNext({ pollId: poll.id });
        addLinkPreview(channel);
      });

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
