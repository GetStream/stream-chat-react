import React, { act } from 'react';
import { cleanup, render } from '@testing-library/react';
import * as nanoid from 'nanoid';

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

import { usePrependedMessagesCount } from '../hooks';
import { VirtualizedMessageList } from '../VirtualizedMessageList';

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
        fixedItemHeight={30}
        initialTopMostItemIndex={0}
        overscan={0}
      />
    )),
  };
});

jest.mock('../../Loading', () => ({
  LoadingIndicator: jest.fn(() => <div>LoadingIndicator</div>),
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
    jest.spyOn(nanoid, 'nanoid').mockReturnValue('mockedId');

    let result;
    await act(() => {
      result = render(
        <Chat client={client}>
          <Channel channel={channel}>
            <VirtualizedMessageList />
          </Channel>
        </Chat>,
      );
    });
    expect(result.container).toMatchSnapshot();
  });
});

describe('usePrependedMessagesCount', () => {
  const TestCase = ({ messages }) => {
    const prependCount = usePrependedMessagesCount(messages);
    return <div data-prepend-count={prependCount} id='prepend-counter' />;
  };

  const expectPrependCount = (count, container) => {
    expect(container.querySelector('#prepend-counter')).toHaveAttribute(
      'data-prepend-count',
      count.toString(),
    );
  };

  it('determines 0 prepended messages for empty message list', async () => {
    const { container } = await render(<TestCase messages={[]} />);
    expectPrependCount(0, container);
  });

  const messageBatch = (ids, status) => ids.map((id) => ({ id, status }));
  const firstBatch = (status) => messageBatch(['a'], status);
  const secondBatch = (status) => messageBatch(['c', 'b'], status);
  const thirdBatch = (status) => messageBatch(['e', 'd'], status);

  const testPrependCount = async (status, first, second, third) => {
    const firstMessage = firstBatch(status);
    const secondMsgBatch = secondBatch(status);
    const thirdMsgBatch = thirdBatch(status);

    const { container, rerender } = await render(<TestCase messages={[]} />);

    await act(async () => {
      await rerender(<TestCase messages={[...firstMessage]} />);
    });
    expectPrependCount(first, container);

    await act(async () => {
      await rerender(<TestCase messages={[...secondMsgBatch, ...firstMessage]} />);
    });
    expectPrependCount(second, container);

    await act(async () => {
      await rerender(
        <TestCase messages={[...thirdMsgBatch, ...secondMsgBatch, ...firstMessage]} />,
      );
    });
    expectPrependCount(third, container);
  };

  it('calculates the prepended count for messages of status "received"', async () => {
    await testPrependCount('received', 0, 2, 4);
  });

  it('ignores the messages of status "sending" from the prepended messages count', async () => {
    await testPrependCount('sending', 0, 0, 0);
  });

  it('ignores the messages of status "failed" from the prepended messages count', async () => {
    await testPrependCount('failed', 0, 0, 0);
  });

  it('calculates the prepended messages count for the messages of status undefined', async () => {
    await testPrependCount(undefined, 0, 2, 4);
  });
});
