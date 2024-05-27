import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Avatar } from '../Avatar';

const AVATAR_ROOT_TEST_ID = 'avatar';
const AVATAR_FALLBACK_TEST_ID = 'avatar-fallback';
const AVATAR_IMG_TEST_ID = 'avatar-img';

afterEach(cleanup); // eslint-disable-line

describe('Avatar', () => {
  it('should render component with default props', () => {
    const tree = renderer.create(<Avatar />).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__avatar str-chat__message-sender-avatar"
        data-testid="avatar"
        onClick={[Function]}
        onMouseOver={[Function]}
      >
        <div
          className="str-chat__avatar-fallback"
          data-testid="avatar-fallback"
        />
      </div>
    `);
  });

  it('should render component with default props and image prop', () => {
    const tree = renderer.create(<Avatar image='random' />).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__avatar str-chat__message-sender-avatar"
        data-testid="avatar"
        onClick={[Function]}
        onMouseOver={[Function]}
      >
        <img
          alt=""
          className="str-chat__avatar-image"
          data-testid="avatar-img"
          onError={[Function]}
          src="random"
        />
      </div>
    `);
  });

  it('should render initials as alt and title', () => {
    const name = 'Cherry Blossom';
    const { getByAltText, getByTitle } = render(<Avatar image='randomImage' name={name} />);

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
    const { getByTestId, queryByTestId } = render(<Avatar image='randomImage' name='Olive' />);
    const img = getByTestId(AVATAR_IMG_TEST_ID);

    expect(img).toBeInTheDocument();
    expect(queryByTestId(AVATAR_FALLBACK_TEST_ID)).not.toBeInTheDocument();
    fireEvent.error(img);
    expect(img).not.toBeInTheDocument();
    expect(getByTestId(AVATAR_FALLBACK_TEST_ID)).toBeInTheDocument();
  });

  it('should render new img on props change for errored img', () => {
    const { getByTestId, queryByTestId, rerender } = render(<Avatar image='randomImage' />);

    fireEvent.error(getByTestId(AVATAR_IMG_TEST_ID));
    expect(queryByTestId(AVATAR_IMG_TEST_ID)).not.toBeInTheDocument();

    rerender(<Avatar image='anotherImage' />);
    expect(getByTestId(AVATAR_IMG_TEST_ID)).toHaveAttribute('src', 'anotherImage');
  });
});
