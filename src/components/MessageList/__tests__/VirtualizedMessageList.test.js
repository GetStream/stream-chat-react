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

import { usePrependedMessagesCount } from '../hooks/usePrependMessagesCount';
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

    function createNodeMock(element) {
      if (element.type === 'div') {
        return {
          addEventListener() {},
          removeEventListener() {},
        };
      }
      return null;
    }

    await renderer.act(() => {
      tree = renderer.create(
        <Chat client={client}>
          <Channel channel={channel}>
            <VirtualizedMessageList />
          </Channel>
        </Chat>,
        {
          createNodeMock,
        },
      );
    });

    expect(tree.toJSON()).toMatchSnapshot();
  });
});

describe('usePrependedMessagesCount', () => {
  const TestCase = ({ messages }) => {
    const prependCount = usePrependedMessagesCount(messages);
    return <div>{prependCount}</div>;
  };

  const expectPrependCount = (count, root) => {
    expect(root.findByType('div').props.children).toStrictEqual(count);
  };

  it('determines 0 prepended messages for empty message list', async () => {
    const render = await renderer.create(<TestCase messages={[]} />);

    expectPrependCount(0, render.root);
  });

  const messageBatch = (ids, status) => ids.map((id) => ({ id, status }));
  const firstBatch = (status) => messageBatch(['a'], status);
  const secondBatch = (status) => messageBatch(['c', 'b'], status);
  const thirdBatch = (status) => messageBatch(['e', 'd'], status);

  const testPrependCount = async (status, first, second, third) => {
    const firstMessage = firstBatch(status);
    const secondMsgBatch = secondBatch(status);
    const thirdMsgBatch = thirdBatch(status);

    const render = await renderer.create(<TestCase messages={[]} />);

    await renderer.act(async () => {
      await render.update(<TestCase messages={[...firstMessage]} />);
      expectPrependCount(first, render.root);
    });

    await renderer.act(async () => {
      await render.update(<TestCase messages={[...secondMsgBatch, ...firstMessage]} />);
      expectPrependCount(second, render.root);
    });

    await renderer.act(async () => {
      await render.update(
        <TestCase messages={[...thirdMsgBatch, ...secondMsgBatch, ...firstMessage]} />,
      );
      expectPrependCount(third, render.root);
    });
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
