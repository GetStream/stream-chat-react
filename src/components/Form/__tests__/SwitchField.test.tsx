import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { SwitchField } from '../SwitchField';
import { axe } from '../../../../axe-helper';
import { AriaLiveAnnouncerContext } from '../../Accessibility';
import { TranslationProvider } from '../../../context';
import type { TranslationContextValue } from '../../../context';

const interpolatingT = ((key: string, options?: Record<string, unknown>) =>
  Object.entries(options ?? {})
    .reduce((value, [name, arg]) => value.replace(`{{ ${name} }}`, String(arg)), key)
    .replace(/^aria\//, '')) as TranslationContextValue['t'];

const renderWithAnnouncer = (ui: React.ReactElement, announce = vi.fn()) => {
  render(
    <TranslationProvider
      value={{ t: interpolatingT } as unknown as TranslationContextValue}
    >
      <AriaLiveAnnouncerContext.Provider value={{ announce }}>
        {ui}
      </AriaLiveAnnouncerContext.Provider>
    </TranslationProvider>,
  );
  return announce;
};

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

  it('uses caller-provided child id for aria-labelledby when title is not provided', () => {
    render(
      <SwitchField defaultChecked={false} id='child-labeled-switch'>
        <div id='switch-child-label'>Enable alerts</div>
      </SwitchField>,
    );

    const switchControl = screen.getByRole('switch', { name: 'Enable alerts' });

    expect(switchControl).toHaveAttribute('aria-labelledby', 'switch-child-label');
  });

  it('announces the on/off state change, naming the setting by its title', () => {
    const announce = renderWithAnnouncer(
      <SwitchField defaultChecked={false} id='notifications' title='Notifications' />,
    );

    const switchControl = screen.getByRole('switch', { name: 'Notifications' });

    fireEvent.click(switchControl);
    expect(announce).toHaveBeenLastCalledWith('Notifications enabled', {
      priority: 'polite',
    });

    fireEvent.click(switchControl);
    expect(announce).toHaveBeenLastCalledWith('Notifications disabled', {
      priority: 'polite',
    });
  });

  it('names the setting from the aria-labelledby target when there is no title', () => {
    const announce = renderWithAnnouncer(
      <SwitchField
        aria-labelledby='vote-limit-label'
        defaultChecked={false}
        id='vote-limit'
      >
        <div id='vote-limit-label'>
          <div className='str-chat__form__switch-field__label__text'>
            Limit votes per person
          </div>
          <div className='str-chat__form__switch-field__label__description'>
            Choose between 2 to 10 options
          </div>
        </div>
      </SwitchField>,
    );

    fireEvent.click(screen.getByRole('switch'));
    // The description must NOT leak into the announced name.
    expect(announce).toHaveBeenLastCalledWith('Limit votes per person enabled', {
      priority: 'polite',
    });
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
