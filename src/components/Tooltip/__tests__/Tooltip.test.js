import React from 'react';

import { Tooltip } from '../Tooltip';
import { render } from '@testing-library/react';

describe('Tooltip', () => {
  it('should render as expected', () => {
    const { container } = render(<Tooltip></Tooltip>);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="str-chat__tooltip"
        />
      </div>
    `);
  });
});
