import React from 'react';
import { render, screen } from '@testing-library/react';

import type { ListItemLayoutContentProps } from '../ListItemLayout';
import { ListItemLayout } from '../ListItemLayout';

const Icon = () => <svg data-testid='icon' />;

const Slot = () => <span data-testid='slot' />;

describe('ListItemLayout', () => {
  it('renders the default content structure with forwarded classes', () => {
    const { container } = render(
      <ListItemLayout
        contentClassName='custom-content'
        description='Description'
        descriptionClassName='custom-description'
        selected
        subtitle='Subtitle'
        subtitleClassName='custom-subtitle'
        title='Title'
        titleClassName='custom-title'
      />,
    );

    const root = container.firstElementChild;
    const itemContainer = container.querySelector(
      '.str-chat__list-item-layout__container',
    );
    const content = container.querySelector('.str-chat__list-item-layout__content');
    const title = container.querySelector('.str-chat__list-item-layout__title');
    const subtitle = container.querySelector('.str-chat__list-item-layout__subtitle');
    const description = container.querySelector(
      '.str-chat__list-item-layout__description',
    );

    expect(root).toHaveClass('str-chat__list-item-layout');
    expect(itemContainer).toHaveClass('str-chat__list-item-layout__container');
    expect(itemContainer).toHaveClass('str-chat__list-item-layout__container--selected');
    expect(content).toHaveClass('custom-content');
    expect(content).toHaveClass('str-chat__list-item-layout__content--withTitle');
    expect(content).toHaveClass('str-chat__list-item-layout__content--withSubtitle');
    expect(content).toHaveClass('str-chat__list-item-layout__content--withDescription');
    expect(title).toHaveClass('custom-title');
    expect(title).toHaveTextContent('Title');
    expect(subtitle).toHaveClass('custom-subtitle');
    expect(subtitle).toHaveTextContent('Subtitle');
    expect(description).toHaveClass('custom-description');
    expect(description).toHaveTextContent('Description');
  });

  it('defaults button roots to type button while allowing explicit overrides', () => {
    const { rerender } = render(
      <ListItemLayout RootElement='button' title='Button title' />,
    );

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');

    rerender(
      <ListItemLayout
        RootElement='button'
        rootProps={{ type: 'submit' }}
        title='Button title'
      />,
    );

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('renders leading and trailing icon and slot components', () => {
    render(
      <ListItemLayout
        LeadingIcon={Icon}
        LeadingSlot={Slot}
        title='Title'
        TrailingIcon={Icon}
        TrailingSlot={Slot}
      />,
    );

    expect(screen.getAllByTestId('icon')).toHaveLength(2);
    expect(screen.getAllByTestId('slot')).toHaveLength(2);
  });

  it('allows overriding the content slot', () => {
    const ContentSlot = ({
      description,
      descriptionClassName,
      subtitle,
      subtitleClassName,
      title,
      titleClassName,
    }: ListItemLayoutContentProps) => (
      <div data-testid='custom-content'>
        <span className={titleClassName}>{title}</span>
        <span className={subtitleClassName}>{subtitle}</span>
        <span className={descriptionClassName}>{description}</span>
      </div>
    );

    render(
      <ListItemLayout
        ContentSlot={ContentSlot}
        description='Description'
        descriptionClassName='custom-description'
        subtitle='Subtitle'
        subtitleClassName='custom-subtitle'
        title='Title'
        titleClassName='custom-title'
      />,
    );

    expect(screen.getByTestId('custom-content')).toHaveTextContent(
      'TitleSubtitleDescription',
    );
    expect(screen.getByText('Title')).toHaveClass('custom-title');
    expect(screen.getByText('Subtitle')).toHaveClass('custom-subtitle');
    expect(screen.getByText('Description')).toHaveClass('custom-description');
  });
});
