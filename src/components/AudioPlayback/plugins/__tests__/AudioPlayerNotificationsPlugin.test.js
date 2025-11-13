import { audioPlayerNotificationsPluginFactory } from '../AudioPlayerNotificationsPlugin';

describe('audioPlayerNotificationsPluginFactory', () => {
  const t = (s) => s;

  const makeClient = () => {
    const addError = jest.fn();
    return {
      addError,
      client: { notifications: { addError } },
    };
  };

  it('reports mapped error messages for known errCodes', () => {
    const { addError, client } = makeClient();
    const plugin = audioPlayerNotificationsPluginFactory({ client, t });

    // simulate failed-to-start
    plugin.onError?.({ errCode: 'failed-to-start', player: {} });

    expect(addError).toHaveBeenCalledTimes(1);
    let call = addError.mock.calls[0][0];
    expect(call.message).toBe('Failed to play the recording');
    expect(call.options.type).toBe('browser:audio:playback:error');
    expect(call.origin.emitter).toBe('AudioPlayer');

    // simulate not-playable
    plugin.onError?.({ errCode: 'not-playable', player: {} });
    call = addError.mock.calls[1][0];
    expect(call.message).toBe(
      'Recording format is not supported and cannot be reproduced',
    );

    // simulate seek-not-supported
    plugin.onError?.({ errCode: 'seek-not-supported', player: {} });
    call = addError.mock.calls[2][0];
    expect(call.message).toBe('Cannot seek in the recording');
  });

  it('falls back to provided Error if no errCode', () => {
    const { addError, client } = makeClient();
    const plugin = audioPlayerNotificationsPluginFactory({ client, t });

    plugin.onError?.({ error: new Error('X-Error'), player: {} });

    const call = addError.mock.calls[0][0];
    expect(call.message).toBe('X-Error');
  });

  it('falls back to generic message if no errCode and no Error', () => {
    const { addError, client } = makeClient();
    const plugin = audioPlayerNotificationsPluginFactory({ client, t });

    plugin.onError?.({ player: {} });

    const call = addError.mock.calls[0][0];
    expect(call.message).toBe('Error reproducing the recording');
  });
});
