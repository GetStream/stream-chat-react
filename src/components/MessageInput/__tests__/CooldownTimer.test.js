import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { CooldownTimer } from '../CooldownTimer';
import '@testing-library/jest-dom';

jest.useFakeTimers();

const TIMER_TEST_ID = 'cooldown-timer';
const remainingProp = 'cooldownInterval';
describe('CooldownTimer', () => {
  it('renders CooldownTimer component', () => {
    render(<CooldownTimer />);
    expect(screen.getByTestId(TIMER_TEST_ID)).toHaveTextContent('0');
  });

  it('initializes with correct state based on cooldownRemaining prop', () => {
    const props = { [remainingProp]: 10 };
    render(<CooldownTimer {...props} />);
    expect(screen.getByTestId(TIMER_TEST_ID)).toHaveTextContent('10');
  });

  it('updates countdown logic correctly', () => {
    const cooldownRemaining = 5;
    const props = { [remainingProp]: cooldownRemaining };
    render(<CooldownTimer {...props} />);

    for (let countDown = cooldownRemaining; countDown >= 0; countDown--) {
      expect(screen.getByTestId(TIMER_TEST_ID)).toHaveTextContent(countDown.toString());
      act(() => {
        jest.runAllTimers();
      });
    }
    expect(screen.getByTestId(TIMER_TEST_ID)).toHaveTextContent('0');
  });

  it('resets countdown when cooldownRemaining prop changes', () => {
    const cooldownRemaining1 = 5;
    const cooldownRemaining2 = 10;
    const props1 = { [remainingProp]: cooldownRemaining1 };
    const props2 = { [remainingProp]: cooldownRemaining2 };
    const timeElapsedBeforeUpdate = 2;

    const { rerender } = render(<CooldownTimer {...props1} />);

    for (let round = timeElapsedBeforeUpdate; round > 0; round--) {
      act(() => {
        jest.runAllTimers();
      });
    }

    expect(screen.getByTestId(TIMER_TEST_ID)).toHaveTextContent(
      (cooldownRemaining1 - timeElapsedBeforeUpdate).toString(),
    );

    rerender(<CooldownTimer {...props2} />);

    expect(screen.queryByTestId(TIMER_TEST_ID)).toHaveTextContent(
      cooldownRemaining2.toString(),
    );
    act(() => {
      jest.runAllTimers();
    });
    expect(screen.queryByTestId(TIMER_TEST_ID)).toHaveTextContent(
      (cooldownRemaining2 - 1).toString(),
    );
  });
});
