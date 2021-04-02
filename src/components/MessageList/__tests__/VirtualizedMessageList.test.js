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
        };
      }
      return null;
    }

    await renderer.act(async () => {
      tree = await renderer.create(
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

  it('calculates the prepended messages using the id prop', async () => {
    const render = await renderer.create(<TestCase messages={[]} />);
    const expectPrependCount = (count) => {
      expect(render.root.findByType('div').props.children).toStrictEqual(count);
    };

    expectPrependCount(0);

    await renderer.act(async () => {
      await render.update(<TestCase messages={[{ id: 'a' }]} />);
      expectPrependCount(0);
    });

    await renderer.act(async () => {
      await render.update(<TestCase messages={[{ id: 'c' }, { id: 'b' }, { id: 'a' }]} />);
      expectPrependCount(2);
    });

    await renderer.act(async () => {
      await render.update(
        <TestCase messages={[{ id: 'e' }, { id: 'd' }, { id: 'c' }, { id: 'b' }, { id: 'a' }]} />,
      );
      expectPrependCount(4);
    });
  });
});
