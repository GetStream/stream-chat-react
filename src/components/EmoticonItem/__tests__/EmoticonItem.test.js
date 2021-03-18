import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { EmoticonItem } from '../EmoticonItem';

afterEach(cleanup); // eslint-disable-line

describe('EmoticonItem', () => {
  it('should render component with empty entity', () => {
    const tree = renderer.create(<EmoticonItem entity={{}} />).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__emoji-item"
      >
        <span
          className="str-chat__emoji-item--entity"
        />
        <span
          className="str-chat__emoji-item--name"
        />
      </div>
    `);
  });

  it('should render component with custom entity prop', async () => {
    const entity = {
      itemNameParts: { match: 'n', parts: ['n', 'ame'] },
      name: 'name',
      native: 'native',
    };
    const Component = <EmoticonItem entity={entity} />;

    const { getByText } = render(Component);
    await waitFor(() => {
      expect(getByText(entity.native)).toBeInTheDocument();
    });

    const tree = renderer.create(Component).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__emoji-item"
      >
        <span
          className="str-chat__emoji-item--entity"
        >
          native
        </span>
        <span
          className="str-chat__emoji-item--name"
        >
          <span
            className="str-chat__emoji-item--highlight"
          >
            n
          </span>
          <span
            className="str-chat__emoji-item--part"
          >
            ame
          </span>
        </span>
      </div>
    `);
  });
});
