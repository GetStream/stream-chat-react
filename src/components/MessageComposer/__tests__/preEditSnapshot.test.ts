import {
  discardPreEditSnapshot,
  restorePreEditSnapshot,
  savePreEditSnapshot,
} from '../preEditSnapshot';
import {
  generateMessage,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';

const user = generateUser();

const setup = async () => {
  const {
    channels: [channel],
  } = await initClientWithChannels({ customUser: user });
  return channel.messageComposer;
};

describe('preEditSnapshot', () => {
  it('restores composer text after cancelling edit', async () => {
    const composer = await setup();
    composer.textComposer.setText('draft in progress');

    const message = generateMessage({ text: 'original message text', user });
    savePreEditSnapshot(composer);
    composer.initState({ composition: message });

    expect(composer.textComposer.text).toBe('original message text');

    restorePreEditSnapshot(composer);

    expect(composer.textComposer.text).toBe('draft in progress');
    expect(composer.editedMessage).toBeFalsy();
  });

  it('restores empty text if composer was empty before edit', async () => {
    const composer = await setup();
    expect(composer.textComposer.text).toBe('');

    const message = generateMessage({ text: 'some text', user });
    savePreEditSnapshot(composer);
    composer.initState({ composition: message });

    restorePreEditSnapshot(composer);

    expect(composer.textComposer.text).toBe('');
    expect(composer.editedMessage).toBeFalsy();
  });

  it('falls back to clear() when no snapshot exists', async () => {
    const composer = await setup();
    composer.textComposer.setText('some text');

    restorePreEditSnapshot(composer);

    expect(composer.textComposer.text).toBe('');
  });

  it('does not overwrite snapshot when entering edit mode twice', async () => {
    const composer = await setup();
    composer.textComposer.setText('my draft');

    savePreEditSnapshot(composer);
    composer.initState({ composition: generateMessage({ text: 'first edit', user }) });

    // Second edit — should NOT overwrite the original snapshot
    savePreEditSnapshot(composer);
    composer.initState({ composition: generateMessage({ text: 'second edit', user }) });

    expect(composer.textComposer.text).toBe('second edit');

    restorePreEditSnapshot(composer);

    expect(composer.textComposer.text).toBe('my draft');
  });

  it('discards snapshot without restoring after successful edit save', async () => {
    const composer = await setup();
    composer.textComposer.setText('my draft');

    savePreEditSnapshot(composer);
    composer.initState({ composition: generateMessage({ text: 'editing', user }) });

    discardPreEditSnapshot(composer);
    composer.clear();

    expect(composer.textComposer.text).toBe('');
    expect(composer.editedMessage).toBeFalsy();
  });
});
