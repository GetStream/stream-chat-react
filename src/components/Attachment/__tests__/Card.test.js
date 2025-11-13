import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Card } from '../Card';

import {
  ChannelActionProvider,
  MessageProvider,
  TranslationContext,
} from '../../../context';
import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { ChatProvider } from '../../../context/ChatContext';
import { ComponentProvider } from '../../../context/ComponentContext';

import {
  generateChannel,
  generateGiphyAttachment,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  mockTranslationContext,
  useMockedApis,
} from '../../../mock-builders';
import { WithAudioPlayback } from '../../AudioPlayer';

let chatClient;
let channel;
const user = generateUser({ id: 'userId', name: 'username' });

jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation();
jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation();
jest.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation();
const addNotificationSpy = jest.fn();
const channelActionContext = { addNotification: addNotificationSpy };

const mockedChannel = generateChannel({
  members: [generateMember({ user })],
  messages: [],
  thread: [],
});

const renderCard = ({ cardProps, chatContext, theRenderer = render }) =>
  theRenderer(
    <ChatProvider value={chatContext}>
      <TranslationContext.Provider value={mockTranslationContext}>
        <ChannelActionProvider value={channelActionContext}>
          <ChannelStateProvider value={{}}>
            <ComponentProvider value={{}}>
              <WithAudioPlayback>
                <Card {...cardProps} />
              </WithAudioPlayback>
            </ComponentProvider>
          </ChannelStateProvider>
        </ChannelActionProvider>
      </TranslationContext.Provider>
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

  const dummyAttachment = {
    asset_url: 'dummyAttachment_asset_url',
    author_name: 'dummyAttachment_author_name',
    image_url: 'dummyAttachment_image_url',
    og_scrape_url: 'dummyAttachment_og_scrape_url',
    text: 'dummyAttachment_text',
    thumb_url: 'dummyAttachment_thumb_url',
    title: 'dummyAttachment_title',
    title_link: 'dummyAttachment_title_link',
  };

  const attachmentTypes = ['audio', 'image', 'video'];

  const cases = attachmentTypes.reduce((acc, type) => {
    const attachment = { ...dummyAttachment, type };
    acc[type] = [
      {
        attachment: { ...attachment, og_scrape_url: undefined, title_link: undefined },
        props: 'og_scrape_url neither title_link is available',
        render: `card without caption`,
      },
      {
        attachment: {
          ...attachment,
          asset_url: undefined,
          image_url: undefined,
          thumb_url: undefined,
          title: undefined,
          title_link: undefined,
        },
        props: 'neither image and asset urls nor title_link are available',
        render: 'unable-to-display card',
      },
      {
        attachment: { ...attachment, title_link: undefined },
        props: 'title_link is not available',
        render: `${type} with caption using og_scrape_url and with asset in header`,
      },
      {
        attachment: { ...attachment, title: undefined },
        props: 'title is not available',
        render: `${type} without title`,
      },
      {
        attachment: { ...attachment, title: undefined, title_link: undefined },
        props: 'title_link neither title is available',
        render: `${type} without title and with caption using og_scrape_url and with image in header`,
      },
    ];
    if (type === 'audio') {
      acc[type].push(
        {
          attachment: {
            ...attachment,
            image_url: undefined,
            thumb_url: undefined,
          },
          props: 'og image URLs are not available',
          render: `audio widget with title & text in Card content and without Card header`,
        },
        {
          attachment: { ...attachment, asset_url: undefined, image_url: undefined },
          props: 'thumb_url is available, but not asset_url, image_url',
          render: `image loaded from thumb_url not ${type} widget`,
        },
        {
          attachment: { ...attachment, asset_url: undefined, thumb_url: undefined },
          props: 'image_url is available, but not asset_url, thumb_url',
          render: `image loaded from image_url not ${type} widget`,
        },
        {
          attachment,
          props: 'all props are available',
          render: `audio widget with image loaded from thumb_url and title & text in Card content`,
        },
        {
          attachment: {
            ...attachment,
            asset_url: undefined,
            image_url: undefined,
            thumb_url: undefined,
          },
          props: 'asset and neither og image URL is available',
          render:
            'content part with title and text only and without the header part of the Card',
        },
      );
    } else if (type === 'video') {
      acc[type].push(
        {
          attachment: {
            ...attachment,
            image_url: undefined,
            thumb_url: undefined,
          },
          props: 'og image URLs are not available',
          render: `video widget in header and title & text in Card content`,
        },
        {
          attachment: { ...attachment, asset_url: undefined, image_url: undefined },
          props: 'thumb_url is available, but not asset_url, image_url',
          render: `image loaded from thumb_url not ${type} widget`,
        },
        {
          attachment: { ...attachment, asset_url: undefined, thumb_url: undefined },
          props: 'image_url is available, but not asset_url, thumb_url',
          render: `image loaded from image_url not ${type} widget`,
        },
        {
          attachment,
          props: 'all props are available',
          render: `video widget in header and title & text in Card content`,
        },
        {
          attachment: {
            ...attachment,
            asset_url: undefined,
            image_url: undefined,
            thumb_url: undefined,
          },
          props: 'scraped media URL is not available',
          render: `content part with title and text only and without the header part of the Card`,
        },
      );
    } else if (type === 'image') {
      acc[type].push(
        {
          attachment: {
            ...attachment,
            image_url: undefined,
            thumb_url: undefined,
          },
          props: 'og image URLs are not available',
          render: `card with title and text only and without the image in the header part of the Card`,
        },
        {
          attachment: { ...attachment, image_url: undefined },
          props: 'thumb_url is available, but not image_url',
          render: `image loaded from thumb_url`,
        },
        {
          attachment: { ...attachment, thumb_url: undefined },
          props: 'image_url is available, but not thumb_url',
          render: `image loaded from image_url`,
        },
      );
    }
    return acc;
  }, {});

  it.each`
    num   | render                   | type                              | props                   | attachment
    ${1}  | ${cases.audio[0].render} | ${cases.audio[0].attachment.type} | ${cases.audio[0].props} | ${cases.audio[0].attachment}
    ${2}  | ${cases.video[0].render} | ${cases.video[0].attachment.type} | ${cases.video[0].props} | ${cases.video[0].attachment}
    ${3}  | ${cases.image[0].render} | ${cases.image[0].attachment.type} | ${cases.image[0].props} | ${cases.image[0].attachment}
    ${4}  | ${cases.audio[1].render} | ${cases.audio[1].attachment.type} | ${cases.audio[1].props} | ${cases.audio[1].attachment}
    ${5}  | ${cases.video[1].render} | ${cases.video[1].attachment.type} | ${cases.video[1].props} | ${cases.video[1].attachment}
    ${6}  | ${cases.image[1].render} | ${cases.image[1].attachment.type} | ${cases.image[1].props} | ${cases.image[1].attachment}
    ${7}  | ${cases.audio[2].render} | ${cases.audio[2].attachment.type} | ${cases.audio[2].props} | ${cases.audio[2].attachment}
    ${8}  | ${cases.video[2].render} | ${cases.video[2].attachment.type} | ${cases.video[2].props} | ${cases.video[2].attachment}
    ${9}  | ${cases.image[2].render} | ${cases.image[2].attachment.type} | ${cases.image[2].props} | ${cases.image[2].attachment}
    ${10} | ${cases.audio[3].render} | ${cases.audio[3].attachment.type} | ${cases.audio[3].props} | ${cases.audio[3].attachment}
    ${11} | ${cases.video[3].render} | ${cases.video[3].attachment.type} | ${cases.video[3].props} | ${cases.video[3].attachment}
    ${12} | ${cases.image[3].render} | ${cases.image[3].attachment.type} | ${cases.image[3].props} | ${cases.image[3].attachment}
    ${13} | ${cases.audio[4].render} | ${cases.audio[4].attachment.type} | ${cases.audio[4].props} | ${cases.audio[4].attachment}
    ${14} | ${cases.video[4].render} | ${cases.video[4].attachment.type} | ${cases.video[4].props} | ${cases.video[4].attachment}
    ${15} | ${cases.image[4].render} | ${cases.image[4].attachment.type} | ${cases.image[4].props} | ${cases.image[4].attachment}
    ${16} | ${cases.audio[5].render} | ${cases.audio[5].attachment.type} | ${cases.audio[5].props} | ${cases.audio[5].attachment}
    ${17} | ${cases.video[5].render} | ${cases.video[5].attachment.type} | ${cases.video[5].props} | ${cases.video[5].attachment}
    ${18} | ${cases.image[5].render} | ${cases.image[5].attachment.type} | ${cases.image[5].props} | ${cases.image[5].attachment}
    ${19} | ${cases.audio[6].render} | ${cases.audio[6].attachment.type} | ${cases.audio[6].props} | ${cases.audio[6].attachment}
    ${20} | ${cases.video[6].render} | ${cases.video[6].attachment.type} | ${cases.video[6].props} | ${cases.video[6].attachment}
    ${21} | ${cases.image[6].render} | ${cases.image[6].attachment.type} | ${cases.image[6].props} | ${cases.image[6].attachment}
    ${22} | ${cases.audio[7].render} | ${cases.audio[7].attachment.type} | ${cases.audio[7].props} | ${cases.audio[7].attachment}
    ${23} | ${cases.video[7].render} | ${cases.video[7].attachment.type} | ${cases.video[7].props} | ${cases.video[7].attachment}
    ${24} | ${cases.image[7].render} | ${cases.image[7].attachment.type} | ${cases.image[7].props} | ${cases.image[7].attachment}
    ${25} | ${cases.audio[8].render} | ${cases.audio[8].attachment.type} | ${cases.audio[8].props} | ${cases.audio[8].attachment}
    ${26} | ${cases.video[8].render} | ${cases.video[8].attachment.type} | ${cases.video[8].props} | ${cases.video[8].attachment}
    ${27} | ${cases.audio[9].render} | ${cases.audio[9].attachment.type} | ${cases.audio[9].props} | ${cases.audio[9].attachment}
    ${28} | ${cases.video[9].render} | ${cases.video[9].attachment.type} | ${cases.video[9].props} | ${cases.video[9].attachment}
  `(
    '($num) should render $render if attachment type is $type and $props',
    async ({ attachment }) => {
      const { container } = await renderCard({
        cardProps: attachment,
        chatContext: { chatClient },
        render,
      });

      await waitFor(() => {
        expect(container).toMatchSnapshot();
      });
    },
  );

  it('should render giphy image if type is giphy', async () => {
    const { container } = await renderCard({
      cardProps: { attachment: generateGiphyAttachment() },
      chatContext: { chatClient },
      render,
    });

    await waitFor(() => {
      expect(container).toMatchSnapshot();
    });
  });
  it('should not render giphy image if url is not available', async () => {
    const { queryByTestId } = await renderCard({
      cardProps: { attachment: generateGiphyAttachment({ giphy: undefined }) },
      chatContext: { chatClient },
      render,
    });

    await waitFor(() => {
      expect(queryByTestId('card-header')).not.toBeInTheDocument();
    });
  });

  it('should display trimmed URL in caption if author_name is not available', async () => {
    const { getByText } = await renderCard({
      cardProps: {
        og_scrape_url:
          'https://www.theverge.com/2020/6/15/21291288/sony-ps5-software-user-interface-ui-design-dashboard-teaser-video',
        title: 'test',
      },
      chatContext: { chatClient },
    });
    await waitFor(() => {
      expect(getByText('theverge.com')).toBeInTheDocument();
    });
  });

  it('differentiates between in thread and in channel audio player', async () => {
    const createdAudios = []; //HTMLAudioElement[]
    const RealAudio = window.Audio;
    const spy = jest.spyOn(window, 'Audio').mockImplementation(function AudioMock(
      ...args
    ) {
      const el = new RealAudio(...args);
      createdAudios.push(el);
      return el;
    });

    const audioAttachment = {
      ...dummyAttachment,
      image_url: undefined,
      thumb_url: undefined,
      title: 'test',
      type: 'audio',
    };

    const message = generateMessage();

    render(
      <ChatProvider value={{}}>
        <ChannelStateProvider value={{}}>
          <WithAudioPlayback>
            <MessageProvider value={{ message }}>
              <Card {...audioAttachment} />
            </MessageProvider>
            <MessageProvider value={{ message, threadList: true }}>
              <Card {...audioAttachment} />
            </MessageProvider>
          </WithAudioPlayback>
        </ChannelStateProvider>
      </ChatProvider>,
    );
    const playButtons = screen.queryAllByTestId('play-audio');
    expect(playButtons.length).toBe(2);
    await Promise.all(
      playButtons.map(async (button) => {
        await fireEvent.click(button);
      }),
    );
    await waitFor(() => {
      expect(createdAudios).toHaveLength(2);
    });
    spy.mockRestore();
  });

  it('keeps a single copy of audio player for the same requester', async () => {
    const createdAudios = []; //HTMLAudioElement[]
    const RealAudio = window.Audio;
    const spy = jest.spyOn(window, 'Audio').mockImplementation(function AudioMock(
      ...args
    ) {
      const el = new RealAudio(...args);
      createdAudios.push(el);
      return el;
    });

    const audioAttachment = {
      ...dummyAttachment,
      image_url: undefined,
      thumb_url: undefined,
      title: 'test',
      type: 'audio',
    };

    const message = generateMessage();
    render(
      <ChatProvider value={{}}>
        <ChannelStateProvider value={{}}>
          <WithAudioPlayback>
            <MessageProvider value={{ message }}>
              <Card {...audioAttachment} />
            </MessageProvider>
            <MessageProvider value={{ message }}>
              <Card {...audioAttachment} />
            </MessageProvider>
          </WithAudioPlayback>
        </ChannelStateProvider>
      </ChatProvider>,
    );
    const playButtons = screen.queryAllByTestId('play-audio');
    expect(playButtons.length).toBe(2);
    await Promise.all(
      playButtons.map(async (button) => {
        await fireEvent.click(button);
      }),
    );
    await waitFor(() => {
      expect(createdAudios).toHaveLength(1);
    });
    spy.mockRestore();
  });
});
