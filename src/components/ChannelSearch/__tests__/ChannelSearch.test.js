import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

import ChannelSearch from '../ChannelSearch';

afterEach(cleanup); // eslint-disable-line

describe('ChannelSearch', () => {
  it('should render component without any props', () => {
    const tree = renderer.create(<ChannelSearch />).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__channel-search"
      >
        <input
          placeholder="Search"
          type="text"
        />
        <button
          type="submit"
        >
          <svg
            height="17"
            viewBox="0 0 18 17"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 17.015l17.333-8.508L0 0v6.617l12.417 1.89L0 10.397z"
              fillRule="evenodd"
            />
          </svg>
        </button>
      </div>
    `);
  });
});
