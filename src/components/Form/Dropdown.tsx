import { FocusScope } from '@react-aria/focus';
import clsx from 'clsx';
import type {
  ComponentProps,
  ComponentType,
  PropsWithChildren,
  ReactNode,
  Ref,
} from 'react';
import React, { useCallback, useEffect, useState } from 'react';

import {
  type PopperLikePlacement,
  usePopoverPosition,
} from '../Dialog/hooks/usePopoverPosition';

type DropdownContextValue = {
  close(): void;
};

const DropdownContext = React.createContext<DropdownContextValue>({
  close: () => null,
});

type DropdownContextProviderProps = DropdownContextValue;

const DropdownContextProvider = ({
  children,
  ...props
}: PropsWithChildren<DropdownContextProviderProps>) => (
  <DropdownContext.Provider value={props}>{children}</DropdownContext.Provider>
);

export const useDropdownContext = () => React.useContext(DropdownContext);

export type DropdownTriggerProps = Pick<
  ComponentProps<'button'>,
  'aria-expanded' | 'onClick'
> & {
  children?: ReactNode;
  referenceRef?: Ref<HTMLElement>;
};

export type DropdownProps = PropsWithChildren<{
  className?: string;
  onClose?: () => void;
  onOpen?: () => void;
  placement?: PopperLikePlacement;
  TriggerComponent?: ComponentType<DropdownTriggerProps>;
  triggerProps?: Omit<DropdownTriggerProps, 'aria-expanded' | 'onClick' | 'referenceRef'>;
  referenceElement?: HTMLElement | null;
}>;

export const Dropdown = ({
  children,
  className,
  onClose,
  onOpen,
  placement = 'bottom',
  referenceElement,
  TriggerComponent,
  triggerProps,
}: DropdownProps) => {
  const [mountedReferenceElement, setMountedReferenceElement] =
    useState<HTMLElement | null>(null);
  const resolvedReferenceElement = TriggerComponent
    ? mountedReferenceElement
    : (referenceElement ?? null);
  const [isOpen, setIsOpen] = useState(!TriggerComponent);
  const [floatingElement, setFloatingElement] = useState<HTMLDivElement | null>(null);
  const { refs, strategy, update, x, y } = usePopoverPosition({
    placement,
  });

  useEffect(() => {
    if (!TriggerComponent) return;
    setIsOpen(false);
  }, [TriggerComponent]);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
      return;
    }
    open();
  }, [close, isOpen, open]);

  useEffect(() => {
    refs.setReference(resolvedReferenceElement);
  }, [refs, resolvedReferenceElement]);

  useEffect(() => {
    refs.setFloating(floatingElement);
  }, [floatingElement, refs]);

  useEffect(() => {
    if (!isOpen || !floatingElement || !resolvedReferenceElement) return;
    update?.();
  }, [floatingElement, isOpen, resolvedReferenceElement, update]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (floatingElement?.contains(event.target)) return;
      if (resolvedReferenceElement?.contains(event.target)) return;
      close();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      close();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keyup', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keyup', handleEscape);
    };
  }, [close, floatingElement, isOpen, resolvedReferenceElement]);

  const DropdownTriggerComponent = TriggerComponent;

  const trigger = DropdownTriggerComponent ? (
    <DropdownTriggerComponent
      aria-expanded={isOpen}
      onClick={toggle}
      referenceRef={setMountedReferenceElement}
      {...triggerProps}
    />
  ) : null;

  const content =
    isOpen && resolvedReferenceElement ? (
      <FocusScope autoFocus restoreFocus>
        <DropdownContextProvider close={close}>
          <div
            className={clsx('str-chat__dropdown__items', className)}
            onClick={close}
            ref={setFloatingElement}
            style={{
              left: x ?? 0,
              position: strategy,
              top: y ?? 0,
            }}
          >
            {children}
          </div>
        </DropdownContextProvider>
      </FocusScope>
    ) : null;

  return (
    <div className='str-chat__dropdown'>
      {trigger}
      {content}
    </div>
  );
};
