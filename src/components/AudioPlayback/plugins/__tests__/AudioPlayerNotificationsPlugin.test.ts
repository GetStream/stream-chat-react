import { fromPartial } from '@total-typescript/shoehorn';
import type { TFunction } from 'i18next';
import { audioPlayerNotificationsPluginFactory } from '../AudioPlayerNotificationsPlugin';

describe('audioPlayerNotificationsPluginFactory', () => {
  const t: TFunction = ((s: string) => s) as TFunction;

  const makeNotifier = () => {
    const addNotification = vi.fn();
    return {
      addNotification,
    };
  };

  it('reports mapped error messages for known errCodes', () => {
    const { addNotification } = makeNotifier();
    const plugin = audioPlayerNotificationsPluginFactory({
      addNotification,
      t,
    });

    // simulate failed-to-start
    plugin.onError?.({ errCode: 'failed-to-start', player: fromPartial({}) });

    expect(addNotification).toHaveBeenCalledTimes(1);
    let call = addNotification.mock.calls[0][0];
    expect(call.message).toBe('Failed to play the recording');
    expect(call.type).toBe('browser:audio:playback:error');
    expect(call.emitter).toBe('AudioPlayer');
    expect(call.severity).toBe('error');

    // simulate not-playable
    plugin.onError?.({ errCode: 'not-playable', player: fromPartial({}) });
    call = addNotification.mock.calls[1][0];
    expect(call.message).toBe(
      'Recording format is not supported and cannot be reproduced',
    );

    // simulate seek-not-supported
    plugin.onError?.({ errCode: 'seek-not-supported', player: fromPartial({}) });
    call = addNotification.mock.calls[2][0];
    expect(call.message).toBe('Cannot seek in the recording');
  });

  it('falls back to provided Error if no errCode', () => {
    const { addNotification } = makeNotifier();
    const plugin = audioPlayerNotificationsPluginFactory({
      addNotification,
      t,
    });

    plugin.onError?.({ error: new Error('X-Error'), player: fromPartial({}) });

    const call = addNotification.mock.calls[0][0];
    expect(call.message).toBe('X-Error');
  });

  it('falls back to generic message if no errCode and no Error', () => {
    const { addNotification } = makeNotifier();
    const plugin = audioPlayerNotificationsPluginFactory({
      addNotification,
      t,
    });

    plugin.onError?.({ player: fromPartial({}) });

    const call = addNotification.mock.calls[0][0];
    expect(call.message).toBe('Error reproducing the recording');
  });

  it('debounces seek-not-supported notifications', () => {
    const { addNotification } = makeNotifier();
    const plugin = audioPlayerNotificationsPluginFactory({
      addNotification,
      t,
    });
    const dateNowSpy = vi.spyOn(Date, 'now');

    dateNowSpy
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1200)
      .mockReturnValueOnce(1800)
      .mockReturnValueOnce(2201);

    plugin.onError?.({ errCode: 'seek-not-supported', player: fromPartial({}) });
    plugin.onError?.({ errCode: 'seek-not-supported', player: fromPartial({}) });
    plugin.onError?.({ errCode: 'seek-not-supported', player: fromPartial({}) });
    plugin.onError?.({ errCode: 'seek-not-supported', player: fromPartial({}) });

    expect(addNotification).toHaveBeenCalledTimes(2);
    expect(addNotification.mock.calls[0][0].message).toBe('Cannot seek in the recording');
    expect(addNotification.mock.calls[1][0].message).toBe('Cannot seek in the recording');

    dateNowSpy.mockRestore();
  });
});
