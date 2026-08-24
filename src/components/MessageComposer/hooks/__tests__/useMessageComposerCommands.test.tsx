import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Command, MessageComposerState } from 'stream-chat';
import { StateStore } from 'stream-chat';

import { useMessageComposerCommands } from '../useMessageComposerCommands';

const mockedUseMessageComposerController = vi.hoisted(() => vi.fn());

let commands: Command[];
let messageComposer: {
  channel: { readonly config: { availableCommands: Command[] } };
  getCommandDisabledReason: ReturnType<typeof vi.fn>;
  isCommandDisabled: ReturnType<typeof vi.fn>;
  state: StateStore<MessageComposerState>;
};
let state: StateStore<MessageComposerState>;

vi.mock('../useMessageComposerController', () => ({
  useMessageComposerController: mockedUseMessageComposerController,
}));

describe('useMessageComposerCommands', () => {
  beforeEach(() => {
    state = new StateStore<MessageComposerState>(
      fromPartial<MessageComposerState>({
        editedMessage: null,
        quotedMessage: null,
      }) as MessageComposerState,
    );
    commands = [
      fromPartial<Command>({
        args: '[text]',
        description: 'Post a random gif to the channel',
        name: 'giphy',
      }),
      fromPartial<Command>({
        args: '[@username] [text]',
        description: 'Ban a user',
        name: 'ban',
        set: 'moderation_set',
      }),
      fromPartial<Command>({
        description: 'missing-name',
      }),
    ];
    messageComposer = {
      channel: {
        // A getter, not a value: `commands` is reassigned per test, and the original `vi.fn` closure
        // read it lazily. A plain object would snapshot it at construction.
        get config() {
          return { availableCommands: commands };
        },
      },
      getCommandDisabledReason: vi.fn((command: Command) => {
        const latestState = state.getLatestValue();

        if (latestState.editedMessage) {
          return 'editing';
        }

        if (
          latestState.quotedMessage &&
          (command.set === 'moderation_set' || command.name === 'moderation_set')
        ) {
          return 'quoted_message';
        }

        return undefined;
      }),
      isCommandDisabled: vi.fn(
        (command: Command) => !!messageComposer.getCommandDisabledReason(command),
      ),
      state,
    };
    mockedUseMessageComposerController.mockReturnValue(messageComposer);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns named commands with enabled state', () => {
    const { result } = renderHook(() => useMessageComposerCommands());

    expect(result.current).toEqual([
      { command: expect.objectContaining({ name: 'giphy' }), enabled: true },
      { command: expect.objectContaining({ name: 'ban' }), enabled: true },
    ]);
  });

  it('updates when entering edit mode and disables all commands', () => {
    const { result } = renderHook(() => useMessageComposerCommands());

    act(() => {
      state.partialNext({
        editedMessage: fromPartial({ id: 'edited-message-id' }),
      });
    });

    expect(result.current).toEqual([
      { command: expect.objectContaining({ name: 'giphy' }), enabled: false },
      { command: expect.objectContaining({ name: 'ban' }), enabled: false },
    ]);
  });

  it('marks quoted-message-disabled commands as disabled while keeping allowed ones enabled', () => {
    const { result } = renderHook(() => useMessageComposerCommands());

    act(() => {
      state.partialNext({
        quotedMessage: fromPartial({ id: 'quoted-message-id' }),
      });
    });

    expect(result.current).toEqual([
      { command: expect.objectContaining({ name: 'giphy' }), enabled: true },
      { command: expect.objectContaining({ name: 'ban' }), enabled: false },
    ]);
  });
});
