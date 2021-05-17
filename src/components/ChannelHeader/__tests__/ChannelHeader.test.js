import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChannelHeader } from '../ChannelHeader';

import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { ChatProvider } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import { generateChannel, generateUser, getTestClientWithUser } from '../../../mock-builders';

const alice = generateUser();
let testChannel1;

async function renderComponent(props, channelData) {
  testChannel1 = generateChannel(channelData);
  const t = jest.fn((key) => key);
  const client = await getTestClientWithUser(alice);

  return render(
    <ChatProvider value={{ channel: testChannel1, client }}>
      <ChannelStateProvider value={{ channel: testChannel1 }}>
        <TranslationProvider value={{ t }}>
          <ChannelHeader {...props} />
        </TranslationProvider>
      </ChannelStateProvider>
    </ChatProvider>,
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
      data: {
        image: 'image.jpg',
        name: 'test-channel-1',
        subtitle: 'test subtitle',
      },
      type: 'commerce',
    });
    expect(getByTestId('avatar-img')).toHaveStyle({
      flexBasis: '60px',
      height: '60px',
      objectFit: 'cover',
      width: '60px',
    });
    expect(getByTestId('avatar')).toHaveStyle({
      flexBasis: '60px',
      fontSize: 30,
      height: '60px',
      lineHeight: '60px',
      width: '60px',
    });
    expect(getByTestId('avatar')).toHaveClass('str-chat__avatar str-chat__avatar--rounded');
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
        member_count: 34,
        name: 'test-channel-1',
        subtitle: 'test subtitle',
      },
    });
    waitFor(() => {
      expect(getByText('34 members')).toBeInTheDocument();
    });
  });
});
