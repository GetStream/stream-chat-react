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
    const { getByTestId, queryByTestId } = render(<Avatar size='md' />);
    const root = getByTestId('avatar');
    expect(root).toHaveClass(
      'str-chat__avatar',
      'str-chat__avatar--no-letters',
      'str-chat__avatar--size-md',
    );
    // No image and no name → renders people icon fallback
    expect(queryByTestId('avatar-img')).not.toBeInTheDocument();
    expect(queryByTestId('avatar-fallback')).not.toBeInTheDocument();
    expect(root.querySelector('svg')).toBeInTheDocument();
  });

  it('should render component with default props and imageUrl prop', () => {
    const { getByTestId } = render(<Avatar imageUrl='random' size='md' />);
    const root = getByTestId('avatar');
    expect(root).toHaveClass(
      'str-chat__avatar',
      'str-chat__avatar--no-letters',
      'str-chat__avatar--size-md',
    );
    const img = getByTestId('avatar-img');
    expect(img).toHaveAttribute('src', 'random');
  });

  it('should render initials as alt and title', () => {
    const userName = 'Cherry Blossom';
    const { getByAltText, getByTitle } = render(
      <Avatar imageUrl='randomImage' size='md' userName={userName} />,
    );

    expect(getByTitle(userName)).toBeInTheDocument();
    expect(getByAltText('CB')).toBeInTheDocument();
  });

  it('should render initials as fallback when no image is supplied', () => {
    const { getByTestId, queryByTestId } = render(
      <Avatar size='md' userName='frank N. Stein' />,
    );
    expect(getByTestId(AVATAR_FALLBACK_TEST_ID)).toHaveTextContent('fS');
    expect(queryByTestId(AVATAR_IMG_TEST_ID)).not.toBeInTheDocument();
  });

  it('should call onClick prop on user click', () => {
    const onClick = jest.fn();

    const { getByTestId } = render(<Avatar onClick={onClick} size='md' />);

    expect(onClick).toHaveBeenCalledTimes(0);
    fireEvent.click(getByTestId(AVATAR_ROOT_TEST_ID));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should call onMouseOver prop on user hover', () => {
    const onMouseOver = jest.fn();

    const { getByTestId } = render(<Avatar onMouseOver={onMouseOver} size='md' />);

    expect(onMouseOver).toHaveBeenCalledTimes(0);
    fireEvent.mouseOver(getByTestId(AVATAR_ROOT_TEST_ID));
    expect(onMouseOver).toHaveBeenCalledTimes(1);
  });

  it('should render fallback initials on img error', () => {
    const { getByTestId, queryByTestId } = render(
      <Avatar imageUrl='randomImage' size='md' userName='Olive' />,
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
      <Avatar imageUrl='randomImage' size='md' />,
    );

    fireEvent.error(getByTestId(AVATAR_IMG_TEST_ID));
    expect(queryByTestId(AVATAR_IMG_TEST_ID)).not.toBeInTheDocument();

    rerender(<Avatar imageUrl='anotherImage' size='md' />);
    expect(getByTestId(AVATAR_IMG_TEST_ID)).toHaveAttribute('src', 'anotherImage');
  });
});
