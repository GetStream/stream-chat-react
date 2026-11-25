import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { axe } from '../../../../axe-helper';
import { SearchInput } from '../SearchInput';

const renderSearchInput = (resetKey?: number) => {
  const onSearchChange = vi.fn();
  const view = render(
    <SearchInput onSearchChange={onSearchChange} resetKey={resetKey} />,
  );
  const input = screen.getByRole('searchbox') as HTMLInputElement;
  const clearButton = screen.getByRole('button', { hidden: true, name: 'Clear search' });
  return { clearButton, input, onSearchChange, view };
};

describe('SearchInput', () => {
  it('reports each change of the query', () => {
    const { input, onSearchChange } = renderSearchInput();

    fireEvent.change(input, { target: { value: 'demo' } });

    expect(input.value).toBe('demo');
    expect(onSearchChange).toHaveBeenLastCalledWith('demo');
  });

  it('hides the clear button while the query is empty', () => {
    const { clearButton, input } = renderSearchInput();

    expect(clearButton).toHaveClass('str-chat__form-text-input__clear-button--hidden');

    fireEvent.change(input, { target: { value: 'demo' } });

    expect(clearButton).not.toHaveClass(
      'str-chat__form-text-input__clear-button--hidden',
    );
  });

  it('clears the query and keeps the focus in the field', () => {
    const { clearButton, input, onSearchChange } = renderSearchInput();
    fireEvent.change(input, { target: { value: 'demo' } });

    fireEvent.click(clearButton);

    expect(input.value).toBe('');
    expect(onSearchChange).toHaveBeenLastCalledWith('');
    expect(input).toHaveFocus();
  });

  it('empties the field when the reset key changes', () => {
    const { input, onSearchChange, view } = renderSearchInput(1);
    fireEvent.change(input, { target: { value: 'demo' } });

    view.rerender(<SearchInput onSearchChange={onSearchChange} resetKey={2} />);

    expect(input.value).toBe('');
  });

  it('passes axe checks', async () => {
    const { view } = renderSearchInput();

    expect(await axe(view.container)).toHaveNoViolations();
  });
});
