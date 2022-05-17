import React from 'react';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Card } from '../Card';

import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { ChatProvider } from '../../../context/ChatContext';

import {
  generateChannel,
  generateMember,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../mock-builders';

let chatClient;
let channel;
const user = generateUser({ id: 'userId', name: 'username' });

const mockedChannel = generateChannel({
  members: [generateMember({ user })],
  messages: [],
  thread: [],
});

const renderCard = (client, cardProps, theRenderer = render) =>
  theRenderer(
    <ChatProvider value={{ client }}>
      <ChannelStateProvider value={{}}>
        <Card {...cardProps} />
      </ChannelStateProvider>
    </ChatProvider>,
  );

describe('Card', () => {
  beforeAll(async () => {
    chatClient = await getTestClientWithUser({ id: user.id });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);
    channel.query();
  });

  afterEach(cleanup);

  it('should render Card with default props', async () => {
    const { container } = await renderCard(chatClient);
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="str-chat__message-attachment-card str-chat__message-attachment-card--undefined"
      >
        <div
          class="str-chat__message-attachment-card--content"
        >
          <div
            class="str-chat__message-attachment-card--text"
          >
            this content could not be displayed
          </div>
        </div>
      </div>
    `);
  });

  it('should render Card with default props and image_url', async () => {
    const { container } = await renderCard(chatClient, { image_url: 'test.jpg' });
    expect(container.firstChild).toMatchInlineSnapshot(`null`);
  });

  it('should render Card with default props and title', async () => {
    const { container } = await renderCard(chatClient, { title: 'test' });
    expect(container.firstChild).toMatchInlineSnapshot(`null`);
  });

  it('should render Card with default props and og_scrape_url', async () => {
    const { container } = await renderCard(chatClient, { og_scrape_url: 'https://google.com' });
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="str-chat__message-attachment-card str-chat__message-attachment-card--undefined"
      >
        <div
          class="str-chat__message-attachment-card--content"
        >
          <div
            class="str-chat__message-attachment-card--text"
          >
            this content could not be displayed
          </div>
        </div>
      </div>
    `);
  });

  it('should render Card with default props and title and og_scrape_url', async () => {
    const { container } = await renderCard(chatClient, {
      og_scrape_url: 'https://google.com',
      title: 'test',
    });
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="str-chat__message-attachment-card str-chat__message-attachment-card--undefined"
      >
        <div
          class="str-chat__message-attachment-card--content"
        >
          <div
            class="str-chat__message-attachment-card--flex"
          >
            <div
              class="str-chat__message-attachment-card--title"
            >
              test
            </div>
            <a
              aria-label="Attachment"
              class="str-chat__message-attachment-card--url"
              href="https://google.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              google.com
            </a>
          </div>
        </div>
      </div>
    `);
  });

  it('should render Card with default props and title, og_scrape_url, image_url', async () => {
    const { container } = await renderCard(chatClient, {
      image_url: 'test.jpg',
      og_scrape_url: 'https://google.com',
      title: 'test',
    });
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="str-chat__message-attachment-card str-chat__message-attachment-card--undefined"
      >
        <div
          class="str-chat__message-attachment-card--header"
        >
          <img
            alt="test.jpg"
            src="test.jpg"
          />
        </div>
        <div
          class="str-chat__message-attachment-card--content"
        >
          <div
            class="str-chat__message-attachment-card--flex"
          >
            <div
              class="str-chat__message-attachment-card--title"
            >
              test
            </div>
            <a
              aria-label="Attachment"
              class="str-chat__message-attachment-card--url"
              href="https://google.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              google.com
            </a>
          </div>
        </div>
      </div>
    `);
  });

  it('should render Card with default props and title, og_scrape_url, image_url, text', async () => {
    const { container } = await renderCard(chatClient, {
      image_url: 'test.jpg',
      og_scrape_url: 'https://google.com',
      text: 'test text',
      title: 'test',
    });

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="str-chat__message-attachment-card str-chat__message-attachment-card--undefined"
      >
        <div
          class="str-chat__message-attachment-card--header"
        >
          <img
            alt="test.jpg"
            src="test.jpg"
          />
        </div>
        <div
          class="str-chat__message-attachment-card--content"
        >
          <div
            class="str-chat__message-attachment-card--flex"
          >
            <div
              class="str-chat__message-attachment-card--title"
            >
              test
            </div>
            <div
              class="str-chat__message-attachment-card--text"
            >
              test text
            </div>
            <a
              aria-label="Attachment"
              class="str-chat__message-attachment-card--url"
              href="https://google.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              google.com
            </a>
          </div>
        </div>
      </div>
    `);
  });

  it('should render trimmed url', async () => {
    const { getByText } = await renderCard(chatClient, {
      og_scrape_url:
        'https://www.theverge.com/2020/6/15/21291288/sony-ps5-software-user-interface-ui-design-dashboard-teaser-video',
      title: 'test',
    });
    expect(getByText('theverge.com')).toBeInTheDocument();
  });

  it('should return null if no og_scrape_url && no title_link', async () => {
    const { container } = await renderCard(chatClient, { title: 'test card' }, render);
    expect(container).toBeEmptyDOMElement();
  });
});
