import React from 'react';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  generateChannel,
  getTestClientWithUser,
  generateUser,
  generateMessage,
} from 'mock-builders';

import FixedHeightMessage from '../FixedHeightMessage';
import { ChatContext, ChannelContext } from '../../../context';
import { Avatar as AvatarMock } from '../../Avatar';
import { Gallery as GalleryMock } from '../../Gallery';
import { MessageActions as MessageActionsMock } from '../../MessageActions';

jest.mock('../../Avatar', () => ({ Avatar: jest.fn(() => <div />) }));
jest.mock('../../Gallery', () => ({ Gallery: jest.fn(() => <div />) }));
jest.mock('../../MessageActions', () => ({
  MessageActions: jest.fn((props) => props.getMessageActions()),
}));

const aliceProfile = { name: 'alice', image: 'alice-avatar.jpg' };
const alice = generateUser(aliceProfile);
const bob = generateUser({ name: 'bob' });

async function renderMsg(message) {
  const channel = generateChannel();
  const client = await getTestClientWithUser(alice);

  return render(
    <ChatContext.Provider value={{ theme: 'dark' }}>
      <ChannelContext.Provider value={{ client, channel }}>
        <FixedHeightMessage message={message} />
      </ChannelContext.Provider>
    </ChatContext.Provider>,
  );
}

describe('<FixedHeightMessage />', () => {
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  it('should render message text', async () => {
    const message = generateMessage({ user: alice });
    const { getByTestId } = await renderMsg(message);
    expect(getByTestId('msg-text')).toHaveTextContent(message.text);
  });

  it('should render message images', async () => {
    const image = { type: 'image', image_url: 'image.jpg' };
    const attachments = [image, image, image];
    const message = generateMessage({ user: alice, attachments });
    await renderMsg(message);
    expect(GalleryMock).toHaveBeenCalledWith({ images: attachments }, {});
  });

  it('should render user avatar', async () => {
    const message = generateMessage({ user: alice });
    await renderMsg(message);
    expect(AvatarMock).toHaveBeenCalledWith(
      expect.objectContaining(aliceProfile),
      {},
    );
  });

  it('should render message action for owner', async () => {
    const message = generateMessage({ user: alice });
    await renderMsg(message);
    expect(MessageActionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ message }),
      {},
    );
    expect(MessageActionsMock).toHaveReturnedWith(['delete']);
  });

  it('should not render message action for others', async () => {
    const message = generateMessage({ user: bob });
    await renderMsg(message);
    expect(MessageActionsMock).toHaveReturnedWith([]);
  });
});
