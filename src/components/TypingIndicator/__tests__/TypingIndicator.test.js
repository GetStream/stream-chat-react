/* eslint-disable sonarjs/no-duplicate-string */
import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  useMockedApis,
  getTestClientWithUser,
  generateUser,
  getOrCreateChannelApi,
  generateChannel,
} from 'mock-builders';

import { ChannelContext } from '../../../context';
import TypingIndicator from '../TypingIndicator';

afterEach(cleanup); // eslint-disable-line

const alice = generateUser();

async function renderComponent(typing = {}) {
  const client = await getTestClientWithUser(alice);

  return render(
    <ChannelContext.Provider value={{ client, typing }}>
      <TypingIndicator />
    </ChannelContext.Provider>,
  );
}

describe('TypingIndicator', () => {
  it('should render null without proper context values', () => {
    const tree = renderer
      .create(
        <ChannelContext.Provider value={{}}>
          <TypingIndicator />
        </ChannelContext.Provider>,
      )
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`null`);
  });

  it('should render hidden indicator with empty typing', async () => {
    const client = await getTestClientWithUser(alice);
    const tree = renderer
      .create(
        <ChannelContext.Provider value={{ client, typing: {} }}>
          <TypingIndicator />
        </ChannelContext.Provider>,
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__typing-indicator "
      >
        <div
          className="str-chat__typing-indicator__avatars"
        />
        <div
          className="str-chat__typing-indicator__dots"
        >
          <span
            className="str-chat__typing-indicator__dot"
          />
          <span
            className="str-chat__typing-indicator__dot"
          />
          <span
            className="str-chat__typing-indicator__dot"
          />
        </div>
      </div>
    `);
  });

  it("should not render TypingIndicator when it's just you typing", async () => {
    const { container } = await renderComponent({ alice: { user: alice } });
    expect(
      container.firstChild.classList.contains(
        'str-chat__typing-indicator--typing',
      ),
    ).toBe(false);
  });

  it('should render TypingIndicator when someone else is typing', async () => {
    const { container, getByTestId } = await renderComponent({
      jessica: { user: { id: 'jessica', image: 'jessica.jpg' } },
    });

    expect(
      container.firstChild.classList.contains(
        'str-chat__typing-indicator--typing',
      ),
    ).toBe(true);
    expect(getByTestId('avatar-img')).toHaveAttribute('src', 'jessica.jpg');
  });

  it('should render TypingIndicator when you and someone else are typing', async () => {
    const { container, getByTestId, getAllByTestId } = await renderComponent({
      alice: { user: alice },
      jessica: { user: { id: 'jessica', image: 'jessica.jpg' } },
    });

    expect(
      container.firstChild.classList.contains(
        'str-chat__typing-indicator--typing',
      ),
    ).toBe(true);
    expect(getAllByTestId('avatar-img')).toHaveLength(1);
    expect(getByTestId('avatar-img')).toHaveAttribute('src', 'jessica.jpg');
  });

  it('should render multiple avatars', async () => {
    const { getAllByTestId } = await renderComponent({
      alice: { user: alice },
      jessica: { user: { id: 'jessica', image: 'jessica.jpg' } },
      joris: { user: { id: 'joris', image: 'joris.jpg' } },
      margriet: { user: { id: 'margriet', image: 'margriet.jpg' } },
    });
    expect(getAllByTestId('avatar-img')).toHaveLength(3);
  });

  it('should render null if typing_events is disabled', async () => {
    const client = await getTestClientWithUser();
    const ch = generateChannel({ config: { typing_events: false } });
    useMockedApis(client, [getOrCreateChannelApi(ch)]);
    const channel = client.channel('messaging', ch.id);
    await channel.watch();

    const tree = renderer
      .create(
        <ChannelContext.Provider value={{ client, typing: {}, channel }}>
          <TypingIndicator />
        </ChannelContext.Provider>,
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(`null`);
  });
});
