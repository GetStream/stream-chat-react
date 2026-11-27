import React from 'react';
import { render } from '@testing-library/react';

import { type AIIconSlots, AIReasoning, IconAIReasoning, useAIIcons } from '..';
import { WithComponents } from '../../../context/WithComponents';
import type { IconSlots } from '../../../components/Icons/slots';

const MyReasoningIcon = () => <svg data-testid='my-reasoning-icon' />;

describe('useAIIcons', () => {
  it("draws the AI components' own icons by default", () => {
    const { container } = render(<AIReasoning text='A thought.' />);
    expect(container.querySelector('.str-chat__ai-reasoning__icon svg')).not.toBeNull();
    expect(container.querySelector('[data-testid="my-reasoning-icon"]')).toBeNull();
  });

  it("takes an app's override from WithComponents' icons, beside the SDK's", () => {
    const icons: IconSlots & AIIconSlots = { IconAIReasoning: MyReasoningIcon };
    const { getByTestId } = render(
      <WithComponents overrides={{ icons }}>
        <AIReasoning text='A thought.' />
      </WithComponents>,
    );
    expect(getByTestId('my-reasoning-icon')).toBeInTheDocument();
  });

  it('keeps the default for a slot set to undefined, and ignores names it lacks', () => {
    const Probe = () => {
      const { IconAIReasoning: Icon } = useAIIcons();
      return <span data-default={String(Icon === IconAIReasoning)} />;
    };
    const icons = { IconAIReasoning: undefined, IconNotAnAIIcon: MyReasoningIcon };
    const { container } = render(
      <WithComponents overrides={{ icons: icons as IconSlots }}>
        <Probe />
      </WithComponents>,
    );
    expect(container.querySelector('span')).toHaveAttribute('data-default', 'true');
  });
});
