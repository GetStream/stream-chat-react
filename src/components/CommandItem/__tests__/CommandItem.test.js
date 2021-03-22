import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CommandItem } from '../CommandItem';

afterEach(cleanup); // eslint-disable-line

describe('commandItem', () => {
  it('should render component with empty entity', () => {
    const tree = renderer.create(<CommandItem entity={{}} />).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__slash-command"
      >
        <span
          className="str-chat__slash-command-header"
        >
          <strong />
           
        </span>
        <br />
        <span
          className="str-chat__slash-command-description"
        />
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

    const tree = renderer.create(Component).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__slash-command"
      >
        <span
          className="str-chat__slash-command-header"
        >
          <strong>
            name
          </strong>
           
          args
        </span>
        <br />
        <span
          className="str-chat__slash-command-description"
        >
          description
        </span>
      </div>
    `);
  });
});
