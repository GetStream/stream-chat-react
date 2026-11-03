import React from 'react';
import type { PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { MessageComposer } from 'stream-chat';
import type { Command, LocationComposerState, StreamChat } from 'stream-chat';

import { SCHEDULE_MESSAGE_CAPABILITY } from '../../constants';
import { useCanScheduleMessage } from '../useCanScheduleMessage';
import {
  ChannelInstanceProvider,
  ChatProvider,
  MessageComposerControllerProvider,
} from '../../../../context';
import {
  generateMessage,
  generateScheduledMessage,
  getTestClientWithUser,
  mockChatContext,
} from '../../../../mock-builders';

type Conditions = {
  hasCapability: boolean;
  hasCommand: boolean;
  hasLocation: boolean;
  hasPoll: boolean;
  isDisabled: boolean;
  isEditingSentMessage: boolean;
};

const CONDITION_NAMES: Array<keyof Conditions> = [
  'hasCapability',
  'hasCommand',
  'hasLocation',
  'hasPoll',
  'isDisabled',
  'isEditingSentMessage',
];

const ALL_CONDITIONS: Conditions[] = Array.from(
  { length: 2 ** CONDITION_NAMES.length },
  (_, combination) =>
    CONDITION_NAMES.reduce(
      (conditions, name, bit) => ({
        ...conditions,
        [name]: !!(combination & (1 << bit)),
      }),
      {} as Conditions,
    ),
);

const describeConditions = (conditions: Conditions) =>
  CONDITION_NAMES.map((name) => `${name}=${conditions[name]}`).join(', ');

const location = fromPartial<LocationComposerState['location']>({
  created_by_device_id: 'device-1',
  latitude: 1,
  longitude: 2,
  message_id: 'message-1',
});

const setup = async ({ hasCapability = true }: { hasCapability?: boolean } = {}) => {
  const client = await getTestClientWithUser({ id: 'user-id' });
  const channel = client.channel('messaging', 'general');
  client.channelServerConfigs = {
    [channel.cid]: fromPartial({
      commands: [{ args: '[text]', description: 'Post a random gif', name: 'giphy' }],
    }),
  };
  channel.data = {
    own_capabilities: hasCapability ? [SCHEDULE_MESSAGE_CAPABILITY] : [],
  };
  const composer = new MessageComposer({ client, compositionContext: channel });
  const renders = { count: 0 };

  const wrapper = ({ children }: PropsWithChildren) => (
    <ChatProvider value={mockChatContext({ client })}>
      <ChannelInstanceProvider value={{ channel }}>
        <MessageComposerControllerProvider messageComposerController={composer}>
          {children}
        </MessageComposerControllerProvider>
      </ChannelInstanceProvider>
    </ChatProvider>
  );

  const hook = renderHook(
    () => {
      renders.count += 1;
      return useCanScheduleMessage();
    },
    { wrapper },
  );

  return { ...hook, client, composer, renders };
};

const applyConditions = (
  client: StreamChat,
  composer: MessageComposer,
  { hasCommand, hasLocation, hasPoll, isDisabled, isEditingSentMessage }: Conditions,
) => {
  client.scheduledMessages.state.partialNext({ isDisabled });
  composer.state.partialNext({
    editedMessage: isEditingSentMessage ? generateMessage() : null,
    pollId: hasPoll ? 'poll-1' : null,
  });
  composer.textComposer.state.partialNext({
    command: hasCommand ? fromPartial<Command>({ name: 'giphy' }) : null,
  });
  composer.locationComposer.state.partialNext({
    location: hasLocation ? location : null,
  });
};

describe('useCanScheduleMessage', () => {
  it.each(
    ALL_CONDITIONS.map((conditions) => [describeConditions(conditions), conditions]),
  )('%s', async (_, conditions) => {
    const { client, composer, result } = await setup({
      hasCapability: conditions.hasCapability,
    });
    const { hasCapability, hasCommand, hasLocation, hasPoll, isDisabled } = conditions;
    const expected =
      hasCapability &&
      !isDisabled &&
      !conditions.isEditingSentMessage &&
      !hasCommand &&
      !hasPoll &&
      !hasLocation;

    act(() => {
      applyConditions(client, composer, conditions);
    });

    expect(result.current).toBe(expected);
  });

  it('is false while a scheduled message is edited', async () => {
    const { composer, result } = await setup();

    act(() => {
      composer.state.partialNext({ editedScheduledMessage: generateScheduledMessage() });
    });

    expect(result.current).toBe(false);
  });

  it('is false when the text starts with a command of the channel', async () => {
    const { composer, result } = await setup();

    act(() => {
      composer.textComposer.state.partialNext({ text: '/giphy cats' });
    });

    expect(result.current).toBe(false);
  });

  it('stays true for text that only looks like a command', async () => {
    const { composer, result } = await setup();

    act(() => {
      composer.textComposer.state.partialNext({ text: '/not-a-command hello' });
    });

    expect(result.current).toBe(true);
  });

  it('becomes schedulable again when the blocking condition goes away', async () => {
    const { composer, result } = await setup();

    act(() => {
      composer.state.partialNext({ pollId: 'poll-1' });
    });
    expect(result.current).toBe(false);

    act(() => {
      composer.state.partialNext({ pollId: null });
    });
    expect(result.current).toBe(true);
  });

  it('does not re-render while typing ordinary text', async () => {
    const { composer, renders } = await setup();
    const rendersBefore = renders.count;

    act(() => {
      composer.textComposer.state.partialNext({ text: 'h' });
      composer.textComposer.state.partialNext({ text: 'he' });
      composer.textComposer.state.partialNext({ text: 'hello' });
    });

    expect(renders.count).toBe(rendersBefore);
  });
});
