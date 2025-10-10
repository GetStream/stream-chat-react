import type { PropsWithChildren } from 'react';
import { useRef } from 'react';
import { useEffect } from 'react';
import React, { useState } from 'react';
import { DialogAnchor, useDialog, useDialogIsOpen } from '../Dialog';
import { DialogManagerProvider, useTranslationContext } from '../../context';
import type { PopperLikePlacement } from '../Dialog';

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

export type DropdownProps = PropsWithChildren<{
  className?: string;
  openButtonProps?: React.HTMLAttributes<HTMLButtonElement>;
  placement?: PopperLikePlacement;
}>;

export const Dropdown = (props: DropdownProps) => {
  const dropdownDialogId = `dropdown`;

  return (
    <div className={'str-chat__dropdown'}>
      <DialogManagerProvider id={dropdownDialogId}>
        <DropdownInner {...props} dialogId={dropdownDialogId} />
      </DialogManagerProvider>
    </div>
  );
};

const DropdownInner = ({
  children,
  dialogId,
  openButtonProps,
  placement = 'bottom',
}: DropdownProps & { dialogId: string }) => {
  const { t } = useTranslationContext();
  const [openButton, setOpenButton] = useState<HTMLButtonElement | null>(null);
  const [dropdownWidth, setDropdownWidth] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dialog = useDialog({ id: dialogId });
  const dropdownDialogIsOpen = useDialogIsOpen(dialogId);

  useEffect(() => {
    if (!openButton || typeof ResizeObserver === 'undefined') return;
    let timeout: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(([button]) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        const width = button.target.getBoundingClientRect().width + 'px';
        if (!dropdownRef.current) {
          setDropdownWidth(width);
          return;
        }
        dropdownRef.current.style.width = width;
      }, 100);
    });
    observer.observe(openButton);

    return () => {
      observer.disconnect();
    };
  }, [openButton]);

  return (
    <DropdownContextProvider close={dialog.close}>
      <button
        aria-expanded={dropdownDialogIsOpen}
        aria-haspopup='true'
        aria-label={t('aria/Open Menu')}
        className='str-chat__dropdown__open-button'
        data-testid='dropdown-open-button'
        {...openButtonProps}
        onClick={() => dialog?.toggle()}
        ref={setOpenButton}
      />
      <DialogAnchor
        allowFlip={false}
        id={dialogId}
        placement={placement}
        referenceElement={openButton}
        tabIndex={-1}
        trapFocus
      >
        <div
          className='str-chat__dropdown__items'
          ref={dropdownRef}
          style={{ width: dropdownWidth }}
        >
          {children}
        </div>
      </DialogAnchor>
    </DropdownContextProvider>
  );
};
