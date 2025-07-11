import type { ChangeEvent, ChangeEventHandler, ComponentProps } from 'react';
import React, { useCallback, useState } from 'react';
import clsx from 'clsx';
import { FieldError } from '../Form/FieldError';
import { useTranslationContext } from '../../context';

type FormElements = 'input' | 'textarea';
type FieldId = string;
type Validator = (
  value: string | readonly string[] | number | boolean | undefined,
) => Error | undefined;

export type FieldConfig = {
  element: FormElements;
  props: ComponentProps<FormElements>;
  label?: React.ReactNode;
  validator?: Validator;
};

type TextInputFormProps<F extends FormValue<Record<FieldId, FieldConfig>>> = {
  close: () => void;
  fields: Record<FieldId, FieldConfig>;
  onSubmit: (formValue: F) => Promise<void>;
  className?: string;
  shouldDisableSubmitButton?: (formValue: F) => boolean;
  title?: string;
};

type FormValue<F extends Record<FieldId, FieldConfig>> = {
  [K in keyof F]: F[K]['props']['value'];
};

export const FormDialog = <
  F extends FormValue<Record<FieldId, FieldConfig>> = FormValue<
    Record<FieldId, FieldConfig>
  >,
>({
  className,
  close,
  fields,
  onSubmit,
  shouldDisableSubmitButton,
  title,
}: TextInputFormProps<F>) => {
  const { t } = useTranslationContext();
  const [fieldErrors, setFieldErrors] = useState<Record<FieldId, Error>>({});
  const [value, setValue] = useState<F>(() => {
    let acc: Partial<F> = {};
    for (const [id, config] of Object.entries(fields)) {
      acc = { ...acc, [id]: config.props.value };
    }
    return acc as F;
  });

  const handleChange = useCallback<
    ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
  >(
    (event) => {
      const fieldId = event.target.id;
      const fieldConfig = fields[fieldId];
      if (!fieldConfig) return;

      const error = fieldConfig.validator?.(event.target.value);
      if (error) {
        setFieldErrors((prev) => ({ [fieldId]: error, ...prev }));
      } else {
        setFieldErrors((prev) => {
          delete prev[fieldId];
          return prev;
        });
      }
      setValue((prev) => ({ ...prev, [fieldId]: event.target.value }));

      if (!fieldConfig.props.onChange) return;

      if (fieldConfig.element === 'input') {
        (fieldConfig.props.onChange as ChangeEventHandler<HTMLInputElement>)(
          event as ChangeEvent<HTMLInputElement>,
        );
      } else if (fieldConfig.element === 'textarea') {
        (fieldConfig.props.onChange as ChangeEventHandler<HTMLTextAreaElement>)(
          event as ChangeEvent<HTMLTextAreaElement>,
        );
      }
    },
    [fields],
  );

  const handleSubmit = async () => {
    if (!Object.keys(value).length) return;
    const errors: Record<FieldId, Error> = {};
    for (const [id, fieldValue] of Object.entries(value)) {
      const thisFieldError = fields[id].validator?.(fieldValue);
      if (thisFieldError) {
        errors[id] = thisFieldError;
      }
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    await onSubmit(value);
    close();
  };

  return (
    <div className={clsx('str-chat__dialog str-chat__dialog--form', className)}>
      <div className='str-chat__dialog__body'>
        {title && <div className='str-chat__dialog__title'>{title}</div>}
        <form
          autoComplete='off'
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {Object.entries(fields).map(([id, fieldConfig]) => (
            <div className='str-chat__dialog__field' key={`dialog-field-${id}`}>
              {fieldConfig.label && (
                <label
                  className={clsx(
                    `str-chat__dialog__title str-chat__dialog__title--${id}`,
                  )}
                  htmlFor={id}
                >
                  {fieldConfig.label}
                </label>
              )}
              {React.createElement(fieldConfig.element, {
                id,
                ...fieldConfig.props,
                onChange: handleChange,
                value: value[id],
              })}
              <FieldError text={fieldErrors[id]?.message} />
            </div>
          ))}
          <div className='str-chat__dialog__controls'>
            <button
              className='str-chat__dialog__controls-button str-chat__dialog__controls-button--cancel'
              onClick={close}
              type='button'
            >
              {t('Cancel')}
            </button>
            <button
              className='str-chat__dialog__controls-button str-chat__dialog__controls-button--submit'
              disabled={
                Object.keys(fieldErrors).length > 0 || shouldDisableSubmitButton?.(value)
              }
              type='submit'
            >
              {t('Send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
