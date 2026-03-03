import React from 'react';
import clsx from 'clsx';
import {
  DragAndDropContainer,
  type DragAndDropContainerProps,
} from '../DragAndDrop/DragAndDropContainer';

export type TextInputFieldSetProps = DragAndDropContainerProps & {
  label?: string;
};

export const TextInputFieldSet = ({
  children,
  className,
  draggable,
  label,
  onSetNewOrder,
}: TextInputFieldSetProps) => (
  <fieldset className={clsx('str-chat__form__input-fieldset', className)}>
    <legend className='str-chat__form__input-fieldset__label'>{label}</legend>
    <DragAndDropContainer
      className='str-chat__form__input-fieldset__values'
      draggable={draggable}
      onSetNewOrder={onSetNewOrder}
    >
      {children}
    </DragAndDropContainer>
  </fieldset>
);
