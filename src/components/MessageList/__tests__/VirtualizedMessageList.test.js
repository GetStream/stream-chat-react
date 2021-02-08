import React from 'react';
import { cleanup } from '@testing-library/react';
import renderer from 'react-test-renderer';
import '@testing-library/jest-dom';

import {
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../mock-builders';

import VirtualizedMessageList from '../VirtualizedMessageList';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';

jest.mock('react-virtuoso', () => {
  const { Virtuoso } = jest.requireActual('react-virtuoso');
  const { forwardRef } = jest.requireActual('react');
  return {
    Virtuoso: forwardRef((props, ref) => (
      <Virtuoso
        ref={ref}
        {...props}
        initialItemCount={20}
        initialTopMostItemIndex={0}
        itemHeight={30}
        overscan={0}
      />
    )),
  };
});

jest.mock('../../Loading', () => ({
  LoadingIndicator: jest.fn(() => <div>LoadingIndicator</div>),
}));

jest.mock('../../Message', () => ({
  FixedHeightMessage: jest.fn(({ groupedByUser }) => (
    <div data-testid='msg'>
      FixedHeightMessage groupedByUser:
      {groupedByUser ? 'true' : 'false'}
    </div>
  )),
}));

async function createChannel(empty = false) {
  const user1 = generateUser();
  const user2 = generateUser();
  const mockedChannel = generateChannel({
    members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
    messages: empty
      ? []
      : ' '
          .repeat(20)
          .split(' ')
          .map((v, i) => generateMessage({ user: i % 3 ? user1 : user2 })),
  });
  const client = await getTestClientWithUser({ id: 'id' });
  useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]); // eslint-disable-line react-hooks/rules-of-hooks
  const channel = client.channel('messaging', mockedChannel.id);
  await channel.watch();

  return { channel, client };
}

// simple test since Virtuoso heavily relies on document height and jsdom doesn't support it
describe('VirtualizedMessageList', () => {
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  it('should render the list without any message', async () => {
    const { channel, client } = await createChannel(true);
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
