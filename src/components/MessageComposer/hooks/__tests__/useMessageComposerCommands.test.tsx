import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { CommandResponse, MessageComposerState } from 'stream-chat';
import { StateStore } from 'stream-chat';

import { useMessageComposerCommands } from '../useMessageComposerCommands';

const mockedUseMessageComposerController = vi.hoisted(() => vi.fn());

let commands: CommandResponse[];
let messageComposer: {
  channel: { getConfig: ReturnType<typeof vi.fn> };
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
      fromPartial<CommandResponse>({
        args: 'giphy-command-args',
        description: 'giphy-command-description',
        name: 'giphy',
      }),
      fromPartial<CommandResponse>({
        args: 'ban-command-args',
        description: 'ban-command-description',
        name: 'ban',
        set: 'moderation_set',
      }),
      fromPartial<CommandResponse>({
        description: 'missing-name',
      }),
    ];
    messageComposer = {
      channel: {
        getConfig: vi.fn(() => ({
          commands,
        })),
      },
      getCommandDisabledReason: vi.fn((command: CommandResponse) => {
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
        (command: CommandResponse) => !!messageComposer.getCommandDisabledReason(command),
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
