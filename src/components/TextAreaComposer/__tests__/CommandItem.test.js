import React from 'react';

import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CommandItem } from '../SuggestionList';

afterEach(cleanup);

describe('commandItem', () => {
  it('should render component with empty entity', () => {
    const { container } = render(<CommandItem entity={{}} />);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="str-chat__slash-command"
        >
          <span
            class="str-chat__slash-command-header"
          >
            <strong />
             
          </span>
          <br />
          <span
            class="str-chat__slash-command-description"
          />
        </div>
      </div>
    `);
  });

  it('should render component with custom entity prop', () => {
    const entity = { args: 'args', description: 'description', name: 'name' };
    const Component = <CommandItem entity={entity} />;

    const { getByText } = render(Component);
    expect(getByText(entity.name)).toBeInTheDocument();
    expect(getByText(entity.args)).toBeInTheDocument();
    expect(getByText(entity.description)).toBeInTheDocument();

    const { container } = render(Component);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="str-chat__slash-command"
        >
          <span
            class="str-chat__slash-command-header"
          >
            <strong>
              name
            </strong>
             
            args
          </span>
          <br />
          <span
            class="str-chat__slash-command-description"
          >
            description
          </span>
        </div>
      </div>
    `);
  });
});
