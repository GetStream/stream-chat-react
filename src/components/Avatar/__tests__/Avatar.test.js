/* eslint-disable sonarjs/no-duplicate-string */
import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import Avatar from '../Avatar';

afterEach(cleanup); // eslint-disable-line

describe('Avatar', () => {
  it('should render component with default props', () => {
    const tree = renderer.create(<Avatar />).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__avatar str-chat__avatar--circle"
        data-testid="avatar"
        onClick={[Function]}
        onMouseOver={[Function]}
        style={
          Object {
            "flexBasis": "32px",
            "fontSize": "16px",
            "height": "32px",
            "lineHeight": "32px",
            "width": "32px",
          }
        }
      >
        <div
          className="str-chat__avatar-fallback"
          data-testid="avatar-fallback"
        >
          
        </div>
      </div>
    `);
  });

  it('should render component with default props and image prop', () => {
    const tree = renderer.create(<Avatar image="random" />).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__avatar str-chat__avatar--circle"
        data-testid="avatar"
        onClick={[Function]}
        onMouseOver={[Function]}
        style={
          Object {
            "flexBasis": "32px",
            "fontSize": "16px",
            "height": "32px",
            "lineHeight": "32px",
            "width": "32px",
          }
        }
      >
        <img
          alt=""
          className="str-chat__avatar-image"
          data-testid="avatar-img"
          onError={[Function]}
          onLoad={[Function]}
          src="random"
          style={
            Object {
              "flexBasis": "32px",
              "height": "32px",
              "objectFit": "cover",
              "width": "32px",
            }
          }
        />
      </div>
    `);
  });

  it('should render with different shape', () => {
    const shape = 'square';

    const { getByTestId } = render(<Avatar shape={shape} />);
    expect(getByTestId('avatar')).toHaveClass(`str-chat__avatar--${shape}`);
  });

  it('should render with different size', () => {
    const size = 24;
    const { getByTestId } = render(<Avatar size={size} />);
    expect(getByTestId('avatar')).toHaveStyle({
      width: `${size}px`,
      height: `${size}px`,
      flexBasis: `${size}px`,
      lineHeight: `${size}px`,
      fontSize: `${size / 2}px`,
    });
  });

  it('should render with different size and image', () => {
    const size = 24;
    const { getByTestId } = render(<Avatar size={size} image="randomImage" />);
    expect(getByTestId('avatar-img')).toHaveStyle({
      width: `${size}px`,
      height: `${size}px`,
      flexBasis: `${size}px`,
      objectFit: 'cover',
    });
  });

  it('should render initials as alt and title', () => {
    const name = 'Cherry Blossom';
    const { getByTitle, getByAltText } = render(
      <Avatar name={name} image="randomImage" />,
    );

    expect(getByTitle(name)).toBeInTheDocument();
    expect(getByAltText(name[0])).toBeInTheDocument();
  });

  it('should render initials as fallback when no image is supplied', () => {
    const { getByTestId, queryByTestId } = render(
      <Avatar name="frank N. Stein" />,
    );
    expect(getByTestId('avatar-fallback')).toHaveTextContent('f');
    expect(queryByTestId('avatar-img')).toBeNull();
  });

  it('should call onClick prop on user click', () => {
    const onClick = jest.fn();

    const { getByTestId } = render(<Avatar onClick={onClick} />);

    expect(onClick).toHaveBeenCalledTimes(0);
    fireEvent.click(getByTestId('avatar'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should call onMouseOver prop on user hover', () => {
    const onMouseOver = jest.fn();

    const { getByTestId } = render(<Avatar onMouseOver={onMouseOver} />);

    expect(onMouseOver).toHaveBeenCalledTimes(0);
    fireEvent.mouseOver(getByTestId('avatar'));
    expect(onMouseOver).toHaveBeenCalledTimes(1);
  });

  it('should update img class on img load', () => {
    const { getByTestId } = render(<Avatar image="randomImage" />);
    const img = getByTestId('avatar-img');

    expect(img).not.toHaveClass('str-chat__avatar-image--loaded');
    fireEvent.load(img);
    expect(img).toHaveClass('str-chat__avatar-image--loaded');
  });

  it('should render fallback initials on img error', () => {
    const { getByTestId, queryByTestId } = render(
      <Avatar name="Olive" image="randomImage" />,
    );
    const img = getByTestId('avatar-img');

    expect(img).toBeInTheDocument();
    expect(queryByTestId('avatar-fallback')).toBeNull();
    fireEvent.error(img);
    expect(img).not.toBeInTheDocument();
    expect(getByTestId('avatar-fallback')).toBeInTheDocument();
  });

  it('should render new img on props change for errored img', () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <Avatar image="randomImage" />,
    );

    fireEvent.error(getByTestId('avatar-img'));
    expect(queryByTestId('avatar-img')).toBeNull();

    rerender(<Avatar image="anotherImage" />);
    expect(getByTestId('avatar-img')).toHaveAttribute('src', 'anotherImage');
  });
});
