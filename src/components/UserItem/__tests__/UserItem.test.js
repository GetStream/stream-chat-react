/* eslint-disable sonarjs/no-duplicate-string */
import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import UserItem from '../UserItem';

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
        <div>
          <strong />
           
        </div>
      </div>
    `);
  });

  it('should render username if provided', () => {
    const { getByText } = render(
      <UserItem entity={{ name: 'Frits Sissing' }} />,
    );
    expect(getByText('Frits Sissing')).toBeInTheDocument();
  });

  it('should render id if no name is provided', () => {
    const { getByText } = render(<UserItem entity={{ id: '123' }} />);
    expect(getByText('123')).toBeInTheDocument();
  });

  it('should render profile picture if provided', () => {
    const { getByTestId } = render(
      <UserItem
        entity={{ id: '123', image: 'frits.jpg', name: 'Frits Sissing' }}
      />,
    );
    expect(getByTestId('avatar-img')).toHaveAttribute('src', 'frits.jpg');
  });
});
