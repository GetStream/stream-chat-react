import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChannelSearch } from '../ChannelSearch';

afterEach(cleanup); // eslint-disable-line

describe('ChannelSearch', () => {
  it('should render component without any props', () => {
    const tree = renderer.create(<ChannelSearch />).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__channel-search"
      >
        <input
          className="str-chat__channel-search-input"
          onChange={[Function]}
          placeholder="Search"
          type="text"
          value=""
        />
        
      </div>
    `);
  });
});
