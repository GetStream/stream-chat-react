import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { SwitchField } from '../SwitchField';
import { axe } from '../../../../axe-helper';

const TestIcon = ({ className }: { className?: string; decorative?: boolean }) => (
  <svg className={className} data-testid='switch-field-icon' />
);

describe('SwitchField', () => {
  it('renders a single switch control with switch semantics', () => {
    render(
      <SwitchField defaultChecked={false} id='notifications' title='Notifications' />,
    );

    const switchControl = screen.getByRole('switch', { name: 'Notifications' });

    expect(switchControl).toBeInTheDocument();
    expect(switchControl).not.toBeChecked();
    expect(switchControl).toHaveAttribute('id', 'notifications');
    expect(screen.queryAllByRole('switch')).toHaveLength(1);
  });

  it('emits onChange with next checked value on click', () => {
    let checkedValue: boolean | undefined;
    const onChange = vi.fn((event) => {
      checkedValue = event.target.checked;
    });

    render(
      <SwitchField
        defaultChecked={false}
        id='show-replies'
        onChange={onChange}
        title='Show replies'
      />,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Show replies' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(checkedValue).toBe(true);
  });

  it('toggles on Space key and preserves event controls for handlers', () => {
    let checkedValue: boolean | undefined;
    const onChange = vi.fn((event) => {
      checkedValue = event.target.checked;
      event.stopPropagation();
    });

    render(
      <SwitchField
        defaultChecked={false}
        id='recording'
        onChange={onChange}
        title='Live recording'
      />,
    );

    const switchControl = screen.getByRole('switch', { name: 'Live recording' });
    switchControl.focus();

    fireEvent.keyDown(switchControl, { key: ' ' });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(checkedValue).toBe(true);
  });

  it('passes axe checks', async () => {
    const { container } = render(
      <SwitchField defaultChecked={false} id='mentions' title='Mentions' />,
    );

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('renders an optional decorative icon without changing the switch name', () => {
    render(
      <SwitchField
        defaultChecked={false}
        Icon={TestIcon}
        id='mute-chat'
        title='Mute chat'
      />,
    );

    expect(screen.getByTestId('switch-field-icon')).toHaveClass(
      'str-chat__form__switch-field__icon',
    );
    expect(screen.getByRole('switch', { name: 'Mute chat' })).toBeInTheDocument();
  });

  it('uses caller-provided child id for aria-labelledby when title is not provided', () => {
    render(
      <SwitchField defaultChecked={false} id='child-labeled-switch'>
        <div id='switch-child-label'>Enable alerts</div>
      </SwitchField>,
    );

    const switchControl = screen.getByRole('switch', { name: 'Enable alerts' });

    expect(switchControl).toHaveAttribute('aria-labelledby', 'switch-child-label');
  });

  it('does not auto-generate aria-labelledby from children without id', () => {
    render(
      <SwitchField defaultChecked={false} id='unlabeled-child-switch'>
        <div>Enable backups</div>
      </SwitchField>,
    );

    const switchControl = screen.getByRole('switch');

    expect(switchControl).not.toHaveAttribute('aria-labelledby');
  });
});
