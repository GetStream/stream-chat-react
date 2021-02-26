import React from 'react';
import renderer from 'react-test-renderer';

import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  it('should render as expected', () => {
    const tree = renderer.create(<Tooltip></Tooltip>).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__tooltip"
      />
    `);
  });
});
