import React from 'react';

import { cleanup, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Avatar } from '../Avatar';

const AVATAR_ROOT_TEST_ID = 'avatar';
const AVATAR_FALLBACK_TEST_ID = 'avatar-fallback';
const AVATAR_IMG_TEST_ID = 'avatar-img';

afterEach(cleanup);

describe('Avatar', () => {
  it('should render component with default props', () => {
    const { container } = render(<Avatar />);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="str-chat__avatar str-chat__message-sender-avatar str-chat__avatar--no-letters"
          data-testid="avatar"
          role="button"
        >
          <svg
            class="str-chat__icon str-chat__icon--user"
            fill="none"
            height="16"
            viewBox="0 0 16 16"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 2C9.1 2 10 2.9 10 4C10 5.1 9.1 6 8 6C6.9 6 6 5.1 6 4C6 2.9 6.9 2 8 2ZM8 12C10.7 12 13.8 13.29 14 14H2C2.23 13.28 5.31 12 8 12ZM8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    `);
  });

  it('should render component with default props and image prop', () => {
    const { container } = render(<Avatar image='random' />);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="str-chat__avatar str-chat__message-sender-avatar str-chat__avatar--no-letters"
          data-testid="avatar"
          role="button"
        >
          <img
            alt=""
            class="str-chat__avatar-image"
            data-testid="avatar-img"
            src="random"
          />
        </div>
      </div>
    `);
  });

  it('should render initials as alt and title', () => {
    const name = 'Cherry Blossom';
    const { getByAltText, getByTitle } = render(
      <Avatar image='randomImage' name={name} />,
    );

    expect(getByTitle(name)).toBeInTheDocument();
    expect(getByAltText(name[0])).toBeInTheDocument();
  });

  it('should render initials as fallback when no image is supplied', () => {
    const { getByTestId, queryByTestId } = render(<Avatar name='frank N. Stein' />);
    expect(getByTestId(AVATAR_FALLBACK_TEST_ID)).toHaveTextContent('f');
    expect(queryByTestId(AVATAR_IMG_TEST_ID)).not.toBeInTheDocument();
  });

  it('should call onClick prop on user click', () => {
    const onClick = jest.fn();

    const { getByTestId } = render(<Avatar onClick={onClick} />);

    expect(onClick).toHaveBeenCalledTimes(0);
    fireEvent.click(getByTestId(AVATAR_ROOT_TEST_ID));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should call onMouseOver prop on user hover', () => {
    const onMouseOver = jest.fn();

    const { getByTestId } = render(<Avatar onMouseOver={onMouseOver} />);

    expect(onMouseOver).toHaveBeenCalledTimes(0);
    fireEvent.mouseOver(getByTestId(AVATAR_ROOT_TEST_ID));
    expect(onMouseOver).toHaveBeenCalledTimes(1);
  });

  it('should render fallback initials on img error', () => {
    const { getByTestId, queryByTestId } = render(
      <Avatar image='randomImage' name='Olive' />,
    );
    const img = getByTestId(AVATAR_IMG_TEST_ID);

    expect(img).toBeInTheDocument();
    expect(queryByTestId(AVATAR_FALLBACK_TEST_ID)).not.toBeInTheDocument();
    fireEvent.error(img);
    expect(img).not.toBeInTheDocument();
    expect(getByTestId(AVATAR_FALLBACK_TEST_ID)).toBeInTheDocument();
  });

  it('should render new img on props change for errored img', () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <Avatar image='randomImage' />,
    );

    fireEvent.error(getByTestId(AVATAR_IMG_TEST_ID));
    expect(queryByTestId(AVATAR_IMG_TEST_ID)).not.toBeInTheDocument();

    rerender(<Avatar image='anotherImage' />);
    expect(getByTestId(AVATAR_IMG_TEST_ID)).toHaveAttribute('src', 'anotherImage');
  });
});
