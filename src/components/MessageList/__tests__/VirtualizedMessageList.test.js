import React from 'react';
import { cleanup } from '@testing-library/react';
import renderer from 'react-test-renderer';
import '@testing-library/jest-dom';

import {
  useMockedApis,
  getOrCreateChannelApi,
  generateChannel,
  generateMessage,
  generateMember,
  generateUser,
  getTestClientWithUser,
} from '../../../mock-builders';

import VirtualizedMessageList from '../VirtualizedMessageList';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';

jest.mock('react-virtuoso', () => {
  const { Virtuoso } = jest.requireActual('react-virtuoso');
  const { forwardRef } = jest.requireActual('react');
  return {
    Virtuoso: forwardRef((props, ref) => (
      <Virtuoso ref={ref} {...props} initialItemCount={10} />
    )),
  };
});

jest.mock('../../Loading', () => ({
  LoadingIndicator: jest.fn(() => <div>LoadingIndicator</div>),
}));

jest.mock('../../Message', () => ({
  FixedHeightMessage: jest.fn(() => <div>FixedHeightMessage</div>),
}));

async function createChannel() {
  const user1 = generateUser();
  const user2 = generateUser();
  const mockedChannel = generateChannel({
    members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
    messages: ' '
      .repeat(100)
      .split(' ')
      .map(() => generateMessage({ user: user1 })),
  });
  const client = await getTestClientWithUser({ id: 'id' });
  useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]); // eslint-disable-line react-hooks/rules-of-hooks
  const channel = client.channel('messaging', mockedChannel.id);
  await channel.query();

  return { client, channel };
}

// simple test since Virtuoso heavily relies on document height and jsdom doesn't support it
describe('VirtualizedMessageList', () => {
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  it('should render empty list of messages', async () => {
    const { client, channel } = await createChannel();

    let tree;
    await renderer.act(async () => {
      tree = await renderer.create(
        <Chat client={client}>
          <Channel channel={channel}>
            <VirtualizedMessageList />
          </Channel>
        </Chat>,
      );
    });

    expect(tree.toJSON()).toMatchSnapshot();
  });
});
