import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { SendButton } from '../SendButton';
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { initClientWithChannels } from '../../../mock-builders';
import { axe } from '../../../../axe-helper';
expect.extend(toHaveNoViolations);

describe('SendButton', () => {
  it('should call whatever callback was passed into the sendMessage prop when the button is pressed', async () => {
    const mock = jest.fn();
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();
    channel.messageComposer.textComposer.setText('Enable the button');
    const { container, getByTitle } = render(
      <Chat client={client}>
        <Channel channel={channel}>
          <SendButton sendMessage={mock} />
        </Channel>
      </Chat>,
    );
    channel.messageComposer.textComposer.setText('X');
    await act(async () => {
      await fireEvent.click(getByTitle('Send'));
    });
    expect(mock).toHaveBeenCalledTimes(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
