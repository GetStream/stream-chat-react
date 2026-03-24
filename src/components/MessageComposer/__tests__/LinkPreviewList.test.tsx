// @ts-nocheck
import {
  generateChannel,
  generateMember,
  generateMessage,
  generateScrapedImageAttachment,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';

import { LinkPreviewStatus } from 'stream-chat';
import { LinkPreviewCard, LinkPreviewList } from '../LinkPreviewList';

const LINK_PREVIEW_TEST_ID = 'link-preview-card';
const userId = 'userId';
const username = 'username';
const mentionId = 'mention-id';
const mentionName = 'mention-name';
const user1 = generateUser({ id: userId, name: username });
const mentionUser = generateUser({
  id: mentionId,
  name: mentionName,
});
const mainListMessage = generateMessage({ user: user1 });
const threadMessage = generateMessage({
  parent_id: mainListMessage.id,
  type: 'reply',
  user: user1,
});
const mockedChannelData = generateChannel({
  members: [generateMember({ user: user1 }), generateMember({ user: mentionUser })],
  messages: [mainListMessage],
  thread: [threadMessage],
});

const renderComponent = async ({
  channelProps = {},
  client,
  linkPreviewListProps = {},
} = {}) => {
  let renderResult;
  await act(() => {
    renderResult = render(
      <Chat client={client}>
        <Channel {...channelProps}>
          <LinkPreviewList {...linkPreviewListProps} />
        </Channel>
      </Chat>,
    );
  });

  return { ...renderResult };
};

const setup = async () => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({
    channelsData: [mockedChannelData],
  });
  return { channel, client };
};

describe('LinkPreviewList', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const previews = Array.from({ length: 4 })
    .map(() => generateScrapedImageAttachment({ status: LinkPreviewStatus.LOADED }))
    .reduce((acc, p) => {
      acc.set(p.og_scrape_url, p);
      return acc;
    }, new Map());

  it('renders previews for each link', async () => {
    const { channel, client } = await setup();
    await renderComponent({
      channelProps: { channel },
      client,
      linkPreviewListProps: { displayLinkCount: previews.size },
    });
    await act(() => {
      channel.messageComposer.linkPreviewsManager.state.next({ previews });
    });
    const linkPreviewCards = screen.getAllByTestId(LINK_PREVIEW_TEST_ID);
    expect(linkPreviewCards).toHaveLength(previews.size);
    Array.from(previews.values()).forEach((p, i) => {
      expect(linkPreviewCards[i]).toHaveTextContent(p.title);
    });
  });
  it('does not render if no previews are available', async () => {
    const previews = new Map();
    const { channel, client } = await setup();
    await renderComponent({
      channelProps: { channel },
      client,
    });
    await act(() => {
      channel.messageComposer.linkPreviewsManager.state.next({ previews });
    });
    const linkPreviewCards = screen.queryAllByTestId(LINK_PREVIEW_TEST_ID);
    expect(linkPreviewCards).toHaveLength(0);
  });

  it('still renders link previews when quoting a message', async () => {
    const { channel, client } = await setup();
    await renderComponent({
      channelProps: { channel },
      client,
    });
    await act(() => {
      channel.messageComposer.linkPreviewsManager.state.next({ previews });
      channel.messageComposer.state.next({ quotedMessage: generateMessage() });
    });
    const linkPreviewCards = screen.queryAllByTestId(LINK_PREVIEW_TEST_ID);
    expect(linkPreviewCards).toHaveLength(1);
  });
});

const renderLinkPreviewCard = async ({ channel, client, linkPreview }) => {
  let result;
  await act(() => {
    result = render(
      <Chat client={client}>
        <Channel channel={channel}>
          <LinkPreviewCard linkPreview={linkPreview} />
        </Channel>
      </Chat>,
    );
  });
  return result;
};
describe('LinPreviewCard', () => {
  it('renders for loaded preview', async () => {
    const { channel, client } = await setup();
    await renderLinkPreviewCard({
      channel,
      client,
      linkPreview: generateScrapedImageAttachment({
        og_scrape_url: 'og_scrape_url',
        status: LinkPreviewStatus.LOADED,
        text: 'text',
        title: 'title',
      }),
    });
    expect(screen.getByTestId(LINK_PREVIEW_TEST_ID)).toBeInTheDocument();
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('text')).toBeInTheDocument();
    expect(screen.getByTestId('link-preview-card-dismiss-btn')).toBeInTheDocument();
  });
  it('renders for loading preview', async () => {
    const { channel, client } = await setup();
    await renderLinkPreviewCard({
      channel,
      client,
      linkPreview: generateScrapedImageAttachment({
        og_scrape_url: 'og_scrape_url',
        status: LinkPreviewStatus.LOADING,
        text: 'text',
        title: 'title',
      }),
    });
    const card = screen.getByTestId(LINK_PREVIEW_TEST_ID);
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('str-chat__link-preview-card--loading');
  });
  it('does not render dismissed preview', async () => {
    const { channel, client } = await setup();
    await renderLinkPreviewCard({
      channel,
      client,
      linkPreview: generateScrapedImageAttachment({
        og_scrape_url: 'og_scrape_url',
        status: LinkPreviewStatus.DISMISSED,
        text: 'text',
        title: 'title',
      }),
    });
    expect(screen.queryByTestId(LINK_PREVIEW_TEST_ID)).not.toBeInTheDocument();
  });
  it('does not render failed preview', async () => {
    const { channel, client } = await setup();
    await renderLinkPreviewCard({
      channel,
      client,
      linkPreview: generateScrapedImageAttachment({
        og_scrape_url: 'og_scrape_url',
        status: LinkPreviewStatus.FAILED,
        text: 'text',
        title: 'title',
      }),
    });
    expect(screen.queryByTestId(LINK_PREVIEW_TEST_ID)).not.toBeInTheDocument();
  });
  it('does not render pending preview', async () => {
    const { channel, client } = await setup();
    await renderLinkPreviewCard({
      channel,
      client,
      linkPreview: generateScrapedImageAttachment({
        og_scrape_url: 'og_scrape_url',
        status: LinkPreviewStatus.PENDING,
        text: 'text',
        title: 'title',
      }),
    });
    expect(screen.queryByTestId(LINK_PREVIEW_TEST_ID)).not.toBeInTheDocument();
  });
  it('allows to dismiss a preview', async () => {
    const { channel, client } = await setup();
    const dismissPreviewMock = vi.spyOn(
      channel.messageComposer.linkPreviewsManager,
      'dismissPreview',
    );
    await renderLinkPreviewCard({
      channel,
      client,
      linkPreview: generateScrapedImageAttachment({ status: LinkPreviewStatus.LOADED }),
    });

    fireEvent.click(screen.getByTestId('link-preview-card-dismiss-btn'));
    expect(dismissPreviewMock).toHaveBeenCalled();
  });
});
