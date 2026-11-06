import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { StopAIGenerationButton } from '../StopAIGenerationButton';
import { WithComponents } from '../../../context';
import { axe } from '../../../../axe-helper';

const CustomStopIcon = () => <svg data-testid='custom-stop-icon' />;

describe('StopAIGenerationButton', () => {
  it('renders the default stop icon and calls onClick when pressed', async () => {
    const onClick = vi.fn();
    const { container } = render(<StopAIGenerationButton onClick={onClick} />);

    const button = screen.getByTestId('stop-ai-generation-button');
    expect(button).toHaveAttribute('type', 'button');
    expect(button.querySelector('.str-chat__icon--stop-fill')).toBeInTheDocument();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the IconStopFill override from the icons slot', () => {
    render(
      <WithComponents overrides={{ icons: { IconStopFill: CustomStopIcon } }}>
        <StopAIGenerationButton />
      </WithComponents>,
    );

    expect(screen.getByTestId('custom-stop-icon')).toBeInTheDocument();
    expect(
      screen
        .getByTestId('stop-ai-generation-button')
        .querySelector('.str-chat__icon--stop-fill'),
    ).not.toBeInTheDocument();
  });

  it('renders children in place of the icon', () => {
    render(
      <StopAIGenerationButton>
        <span data-testid='stop-label'>Stop</span>
      </StopAIGenerationButton>,
    );

    expect(screen.getByTestId('stop-label')).toBeInTheDocument();
    expect(
      screen
        .getByTestId('stop-ai-generation-button')
        .querySelector('.str-chat__icon--stop-fill'),
    ).not.toBeInTheDocument();
  });
});
