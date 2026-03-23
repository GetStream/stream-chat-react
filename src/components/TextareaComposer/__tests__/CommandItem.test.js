import React from 'react';

import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CommandItem } from '../SuggestionList';

afterEach(cleanup);

describe('commandItem', () => {
  it('should render nothing with empty entity (no name)', () => {
    const { container } = render(<CommandItem entity={{}} />);
    // CommandItem returns null when entity.name is falsy
    expect(container).toBeEmptyDOMElement();
  });

  it('should render component with custom entity prop', () => {
    const entity = { args: 'args', description: 'description', name: 'name' };
    const Component = <CommandItem entity={entity} />;

    const { getByText } = render(Component);
    // Component now renders via CommandContextMenuItem (ContextMenuButton)
    // name appears as label, args combined with name as details ("/name args")
    expect(getByText(entity.name)).toBeInTheDocument();

    const { container } = render(Component);
    const button = container.querySelector(
      'button.str-chat__context-menu__button--command',
    );
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', `${entity.description} ${entity.args}`);
    expect(
      container.querySelector('.str-chat__context-menu__button__label'),
    ).toHaveTextContent(entity.name);
    expect(
      container.querySelector('.str-chat__context-menu__button__details'),
    ).toHaveTextContent(`/${entity.name} ${entity.args}`);
  });
});
