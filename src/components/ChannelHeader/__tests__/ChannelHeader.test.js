/* eslint-disable sonarjs/no-duplicate-string */
import React from 'react';
import { render, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  getTestClientWithUser,
  generateUser,
  generateChannel,
} from 'mock-builders';
import ChannelHeader from '../ChannelHeader';
import {
  ChatContext,
  TranslationContext,
  ChannelContext,
} from '../../../context';

const alice = generateUser();
let testChannel1;

async function renderComponent(props, channelData) {
  testChannel1 = generateChannel(channelData);
  const t = jest.fn((key) => key);
  const client = await getTestClientWithUser(alice);
  return render(
    <ChatContext.Provider value={{ client, channel: testChannel1 }}>
      <ChannelContext.Provider value={{ client, channel: testChannel1 }}>
        <TranslationContext.Provider value={{ t }}>
          <ChannelHeader {...props} />
        </TranslationContext.Provider>
      </ChannelContext.Provider>
    </ChatContext.Provider>,
  );
}

afterEach(cleanup); // eslint-disable-line

describe('ChannelHeader', () => {
  it('should display live label when prop live is true', async () => {
    const { container } = await renderComponent(
      { live: true },
      { data: { image: 'image.jpg', name: 'test-channel-1' } },
    );
    expect(
      container.querySelector('.str-chat__header-livestream-left--livelabel'),
    ).toBeInTheDocument();
  });

  it('should display avatar when channel has an image', async () => {
    const { getByTestId } = await renderComponent(
      { live: false },
      { data: { image: 'image.jpg', name: 'test-channel-1' } },
    );
    expect(getByTestId('avatar-img')).toBeInTheDocument();
    expect(getByTestId('avatar-img')).toHaveAttribute('src', 'image.jpg');
  });

  it('should display custom title', async () => {
    const { getByText } = await renderComponent(
      { title: 'Custom Title' },
      { data: { image: 'image.jpg', name: 'test-channel-1' } },
    );
    expect(getByText('Custom Title')).toBeInTheDocument();
  });

  it('should display subtitle if present in channel data', async () => {
    const { getByText } = await renderComponent(null, {
      data: {
        image: 'image.jpg',
        name: 'test-channel-1',
        subtitle: 'test subtitle',
      },
    });
    expect(getByText('test subtitle')).toBeInTheDocument();
  });

  it('should display bigger image if channelType is commerce', async () => {
    const { getByTestId } = await renderComponent(null, {
      type: 'commerce',
      data: {
        image: 'image.jpg',
        name: 'test-channel-1',
        subtitle: 'test subtitle',
      },
    });
    expect(getByTestId('avatar-img')).toHaveStyle({
      width: '60px',
      height: '60px',
      flexBasis: '60px',
      objectFit: 'cover',
    });
    expect(getByTestId('avatar')).toHaveStyle({
      width: '60px',
      height: '60px',
      flexBasis: '60px',
      lineHeight: '60px',
      fontSize: 30,
    });
    expect(getByTestId('avatar')).toHaveClass(
      'str-chat__avatar str-chat__avatar--rounded',
    );
  });

  it('should display watcher_count', async () => {
    const { getByText } = await renderComponent(null, {
      data: {
        image: 'image.jpg',
        name: 'test-channel-1',
        subtitle: 'test subtitle',
        watcher_count: 34,
      },
    });
    waitFor(() => {
      expect(getByText('34 online')).toBeInTheDocument();
    });
  });

  it('should display correct member_count', async () => {
    const { getByText } = await renderComponent(null, {
      data: {
        image: 'image.jpg',
        name: 'test-channel-1',
        subtitle: 'test subtitle',
        member_count: 34,
      },
    });
    waitFor(() => {
      expect(getByText('34 members')).toBeInTheDocument();
    });
  });
});
