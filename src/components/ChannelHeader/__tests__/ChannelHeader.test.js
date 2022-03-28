import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChannelHeader } from '../ChannelHeader';

import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { ChatProvider } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import { generateChannel, generateUser, getTestClientWithUser } from '../../../mock-builders';
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

const alice = generateUser();
let testChannel1;

const CustomMenuIcon = () => <div id='custom-icon'>Custom Menu Icon</div>;

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
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    expect(
      container.querySelector('.str-chat__header-livestream-left--livelabel'),
    ).toBeInTheDocument();
  });

  it('should display avatar when channel has an image', async () => {
    const { container, getByTestId } = await renderComponent(
      { live: false },
      { data: { image: 'image.jpg', name: 'test-channel-1' } },
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    expect(getByTestId('avatar-img')).toBeInTheDocument();
    expect(getByTestId('avatar-img')).toHaveAttribute('src', 'image.jpg');
  });

  it('should display custom title', async () => {
    const { container, getByText } = await renderComponent(
      { title: 'Custom Title' },
      { data: { image: 'image.jpg', name: 'test-channel-1' } },
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    expect(getByText('Custom Title')).toBeInTheDocument();
  });

  it('should display subtitle if present in channel data', async () => {
    const { container, getByText } = await renderComponent(null, {
      data: {
        image: 'image.jpg',
        name: 'test-channel-1',
        subtitle: 'test subtitle',
      },
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    expect(getByText('test subtitle')).toBeInTheDocument();
  });

  it('should display bigger image if channelType is commerce', async () => {
    const { container, getByTestId } = await renderComponent(null, {
      data: {
        image: 'image.jpg',
        name: 'test-channel-1',
        subtitle: 'test subtitle',
      },
      type: 'commerce',
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
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
    const { container, getByText } = await renderComponent(null, {
      data: {
        image: 'image.jpg',
        name: 'test-channel-1',
        subtitle: 'test subtitle',
        watcher_count: 34,
      },
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    waitFor(() => {
      expect(getByText('34 online')).toBeInTheDocument();
    });
  });

  it('should display correct member_count', async () => {
    const { container, getByText } = await renderComponent(null, {
      data: {
        image: 'image.jpg',
        member_count: 34,
        name: 'test-channel-1',
        subtitle: 'test subtitle',
      },
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    waitFor(() => {
      expect(getByText('34 members')).toBeInTheDocument();
    });
  });

  it('should display default menu icon if none provided', async () => {
    const { getByTestId } = await renderComponent();
    expect(getByTestId('menu-icon')).toMatchInlineSnapshot(`
      <svg
        data-testid="menu-icon"
        viewBox="0 0 448 512"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>
          Menu
        </title>
        <path
          d="M0 88C0 74.75 10.75 64 24 64H424C437.3 64 448 74.75 448 88C448 101.3 437.3 112 424 112H24C10.75 112 0 101.3 0 88zM0 248C0 234.7 10.75 224 24 224H424C437.3 224 448 234.7 448 248C448 261.3 437.3 272 424 272H24C10.75 272 0 261.3 0 248zM424 432H24C10.75 432 0 421.3 0 408C0 394.7 10.75 384 24 384H424C437.3 384 448 394.7 448 408C448 421.3 437.3 432 424 432z"
          fill="currentColor"
        />
      </svg>
    `);
  });

  it('should display custom menu icon', async () => {
    const { container } = await renderComponent({
      MenuIcon: CustomMenuIcon,
    });
    expect(container.querySelector('div#custom-icon')).toBeInTheDocument();
  });
});
