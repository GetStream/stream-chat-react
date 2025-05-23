import React from 'react';

import { cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { EmoticonItem } from '../SuggestionList';

afterEach(cleanup);

describe('EmoticonItem', () => {
  it('should not render component with empty entity', () => {
    const { container } = render(<EmoticonItem entity={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render component with custom entity prop', async () => {
    const entity = {
      name: 'name',
      native: 'native',
      tokenizedDisplayName: { parts: ['n', 'ame'], token: 'n' },
    };
    const Component = <EmoticonItem entity={entity} />;

    const { getByText } = render(Component);
    await waitFor(() => {
      expect(getByText(entity.native)).toBeInTheDocument();
    });

    const { container } = render(Component);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="str-chat__emoji-item"
        >
          <span
            class="str-chat__emoji-item--entity"
          >
            native
          </span>
          <span
            class="str-chat__emoji-item--name"
          >
            <span
              class="str-chat__emoji-item--highlight"
            >
              n
            </span>
            <span
              class="str-chat__emoji-item--part"
            >
              ame
            </span>
          </span>
        </div>
      </div>
    `);
  });
});
