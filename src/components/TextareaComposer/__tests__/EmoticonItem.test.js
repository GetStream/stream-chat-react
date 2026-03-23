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
    // Component now renders via EmojiContextMenuButton (a <button>)
    const button = container.querySelector('button.str-chat__emoji-item');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('str-chat__context-menu__button');
    expect(button).toHaveClass('str-chat__emoji-context-menu__button');
    expect(container.querySelector('.str-chat__emoji-item--entity')).toHaveTextContent(
      'native',
    );
    expect(container.querySelector('.str-chat__emoji-item--highlight')).toHaveTextContent(
      'n',
    );
    expect(container.querySelector('.str-chat__emoji-item--part')).toHaveTextContent(
      'ame',
    );
  });
});
