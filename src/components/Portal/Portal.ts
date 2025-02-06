import type { PropsWithChildren, ReactPortal } from 'react';
import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type PortalProps = {
  getPortalDestination: () => Element | null;
  isOpen?: boolean;
};

export const Portal = ({
  children,
  getPortalDestination,
  isOpen,
}: PropsWithChildren<PortalProps>): ReactPortal | null => {
  const [portalDestination, setPortalDestination] = useState<Element | null>(null);

  useLayoutEffect(() => {
    const destination = getPortalDestination();
    if (!destination || !isOpen) return;
    setPortalDestination(destination);
  }, [getPortalDestination, isOpen]);

  if (!portalDestination) return null;

  return createPortal(children, portalDestination);
};
