/* eslint-disable sonarjs/no-duplicate-string */
import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { getTestClientWithUser } from 'mock-builders';

import TypingIndicator from '../TypingIndicator';

afterEach(cleanup); // eslint-disable-line

describe('TypingIndicator', () => {
  it('should render with default props', () => {
    const tree = renderer.create(<TypingIndicator typing={{}} />).toJSON();
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
    const fritsClient = await getTestClientWithUser({ id: 'frits' });
    const { container } = render(
      <TypingIndicator
        client={fritsClient}
        typing={{ frits: { user: { id: 'frits' } } }}
      />,
    );
    expect(
      container.firstChild.classList.contains(
        'str-chat__typing-indicator--typing',
      ),
    ).toBe(false);
  });

  it('should render TypingIndicator when someone else is typing', async () => {
    const fritsClient = await getTestClientWithUser({ id: 'frits' });
    const { container, getByTestId } = render(
      <TypingIndicator
        client={fritsClient}
        typing={{
          jessica: { user: { id: 'jessica', image: 'jessica.jpg' } },
        }}
      />,
    );
    expect(
      container.firstChild.classList.contains(
        'str-chat__typing-indicator--typing',
      ),
    ).toBe(true);
    expect(getByTestId('avatar-img')).toHaveAttribute('src', 'jessica.jpg');
  });

  it('should render TypingIndicator when you and someone else are typing', async () => {
    const fritsClient = await getTestClientWithUser({ id: 'frits' });
    const { container, getByTestId } = render(
      <TypingIndicator
        client={fritsClient}
        typing={{
          frits: { user: { id: 'frits' } },
          jessica: { user: { id: 'jessica', image: 'jessica.jpg' } },
        }}
      />,
    );
    expect(
      container.firstChild.classList.contains(
        'str-chat__typing-indicator--typing',
      ),
    ).toBe(true);
    expect(getByTestId('avatar-img')).toHaveAttribute('src', 'jessica.jpg');
  });

  it('should render multiple avatars', async () => {
    const fritsClient = await getTestClientWithUser({ id: 'frits' });
    const { getAllByTestId } = render(
      <TypingIndicator
        client={fritsClient}
        typing={{
          frits: { user: { id: 'frits' } },
          jessica: { user: { id: 'jessica', image: 'jessica.jpg' } },
          joris: { user: { id: 'joris', image: 'joris.jpg' } },
          margriet: { user: { id: 'margriet', image: 'margriet.jpg' } },
        }}
      />,
    );
    expect(getAllByTestId('avatar-img')).toHaveLength(3);
  });
});
