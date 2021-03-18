import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { UserItem } from '../UserItem';

afterEach(cleanup); // eslint-disable-line

describe('UserItem', () => {
  it('should render component with default props', () => {
    const tree = renderer.create(<UserItem entity={{}} />).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__user-item"
      >
        <div
          className="str-chat__avatar str-chat__avatar--circle"
          data-testid="avatar"
          onClick={[Function]}
          onMouseOver={[Function]}
          style={
            Object {
              "flexBasis": "20px",
              "fontSize": "10px",
              "height": "20px",
              "lineHeight": "20px",
              "width": "20px",
            }
          }
        >
          <div
            className="str-chat__avatar-fallback"
            data-testid="avatar-fallback"
          >
            
          </div>
        </div>
        <span
          className="str-chat__user-item--name"
          data-testid="user-item-name"
        />
      </div>
    `);
  });

  it('should render username if provided', () => {
    const { getByText } = render(
      <UserItem
        entity={{
          itemNameParts: { match: 'g', parts: ['Frits Sissin', 'g'] },
          name: 'Frits Sissing',
        }}
      />,
    );
    expect(getByText('Frits Sissin')).toBeInTheDocument();
    expect(getByText('g')).toBeInTheDocument();
  });

  it('should render profile picture if provided', () => {
    const { getByTestId } = render(
      <UserItem
        entity={{
          id: '123',
          image: 'frits.jpg',
          itemNameParts: { match: 'f', parts: ['F', 'rits Sissing'] },
          name: 'Frits Sissing',
        }}
      />,
    );
    expect(getByTestId('avatar-img')).toHaveAttribute('src', 'frits.jpg');
  });
});
