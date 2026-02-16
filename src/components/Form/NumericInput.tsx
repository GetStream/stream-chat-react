import clsx from 'clsx';
import React, { forwardRef, useCallback } from 'react';
import type { ChangeEvent, ComponentProps, KeyboardEvent } from 'react';
import { useStableId } from '../UtilityComponents/useStableId';
import { IconPlusSmall } from '../Icons';
import { Button } from '../Button';

export type NumericInputProps = Omit<
  ComponentProps<'input'>,
  'className' | 'type' | 'value' | 'onChange'
> & {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Optional label above the input */
  label?: string;
  /** Minimum value (stepper) */
  min?: number;
  /** Maximum value (stepper) */
  max?: number;
  /** Step for increment/decrement (default 1) */
  step?: number;
  className?: string;
};

const parseNumeric = (s: string): number | null => {
  const trimmed = s.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
};

const clamp = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max);

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  function NumericInput(
    {
      className,
      disabled = false,
      id: idProp,
      label,
      max,
      min,
      onChange,
      step = 1,
      value,
      ...inputProps
    },
    ref,
  ) {
    const generatedId = useStableId();
    const id = idProp ?? generatedId;

    const num = parseNumeric(value);
    const minDef = min ?? -Infinity;
    const maxDef = max ?? Infinity;
    const atMin = num !== null && num <= minDef;
    const atMax = num !== null && num >= maxDef;

    const handleInputChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        if (next === '' || /^\d+$/.test(next)) {
          onChange(e);
        }
      },
      [onChange],
    );

    const createChangeEvent = useCallback(
      (newValue: string): ChangeEvent<HTMLInputElement> =>
        ({
          currentTarget: { value: newValue },
          target: { value: newValue },
        }) as ChangeEvent<HTMLInputElement>,
      [],
    );

    const handleDecrement = useCallback(() => {
      if (disabled || atMin) return;
      const next = num !== null ? clamp(num - step, minDef, maxDef) : minDef;
      onChange(createChangeEvent(String(next)));
    }, [disabled, atMin, num, step, minDef, maxDef, onChange, createChangeEvent]);

    const handleIncrement = useCallback(() => {
      if (disabled || atMax) return;
      const next = num !== null ? clamp(num + step, minDef, maxDef) : minDef;
      onChange(createChangeEvent(String(next)));
    }, [disabled, atMax, num, step, minDef, maxDef, onChange, createChangeEvent]);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          handleDecrement();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          handleIncrement();
        }
      },
      [handleDecrement, handleIncrement],
    );

    return (
      <div
        className={clsx(
          'str-chat__form-numeric-input',
          disabled && 'str-chat__form-numeric-input--disabled',
          className,
        )}
      >
        {!!label && (
          <label className='str-chat__form-numeric-input__label' htmlFor={id}>
            {label}
          </label>
        )}
        <div className={clsx('str-chat__form-numeric-input__wrapper')}>
          <Button
            aria-label='Decrease value'
            className={clsx(
              'str-chat__form-numeric-input__stepper str-chat__form-numeric-input__stepper--decrement',
              'str-chat__button--circular',
              'str-chat__button--secondary',
              'str-chat__button--outline',
            )}
            disabled={disabled || atMin}
            onClick={handleDecrement}
          >
            <span aria-hidden className='str-chat__form-numeric-input__stepper-icon'>
              −
            </span>
          </Button>
          <input
            className='str-chat__form-numeric-input__input'
            disabled={disabled}
            id={id}
            inputMode='numeric'
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            ref={ref}
            type='text'
            value={value}
            {...inputProps}
          />
          <Button
            aria-label='Increase value'
            className={clsx(
              'str-chat__form-numeric-input__stepper str-chat__form-numeric-input__stepper--increment',
              'str-chat__button--circular',
              'str-chat__button--secondary',
              'str-chat__button--outline',
              'str-chat__button--size-sm',
            )}
            disabled={disabled || atMax}
            onClick={handleIncrement}
          >
            <IconPlusSmall className='str-chat__form-numeric-input__stepper-icon' />
          </Button>
        </div>
      </div>
    );
  },
);
