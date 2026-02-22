import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useState } from 'react';

export type Validators<V extends Record<string, unknown>> = {
  [K in keyof V]?: (value: V[K]) => Error | undefined;
};

export type UseFormStateOptions<V extends Record<string, unknown>> = {
  initialValue: V;
  validators?: Validators<V>;
  onSubmit: (value: V) => Promise<void>;
};

export type UseFormStateReturn<V extends Record<string, unknown>> = {
  value: V;
  setValue: Dispatch<SetStateAction<V>>;
  setFieldValue: (field: keyof V, value: V[keyof V]) => void;
  fieldErrors: Record<string, Error>;
  handleSubmit: (e?: React.FormEvent) => void;
};

export function useFormState<V extends Record<string, unknown>>(
  options: UseFormStateOptions<V>,
): UseFormStateReturn<V> {
  const { initialValue, onSubmit, validators = {} as Validators<V> } = options;
  const [value, setValue] = useState<V>(initialValue);
  const [fieldErrors, setFieldErrors] = useState<Record<string, Error>>({});

  const setFieldValue = useCallback(
    (field: keyof V, fieldValue: V[keyof V]) => {
      setValue((prev) => ({ ...prev, [field]: fieldValue }) as V);
      const validator = validators[field];
      if (validator) {
        const err = validator(fieldValue);
        setFieldErrors((prev) => {
          const next = { ...prev };
          if (err) next[field as string] = err;
          else delete next[field as string];
          return next;
        });
      }
    },
    [validators],
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const errors: Record<string, Error> = {};
      for (const key of Object.keys(value) as (keyof V)[]) {
        const validator = validators[key];
        if (validator) {
          const err = validator(value[key]);
          if (err) errors[key as string] = err;
        }
      }
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setFieldErrors({});
      void onSubmit(value);
    },
    [value, validators, onSubmit],
  );

  return {
    fieldErrors,
    handleSubmit,
    setFieldValue,
    setValue,
    value,
  };
}
