import { PropsWithChildren, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type PortalProps = {
  container?: Element | null;
  containerId?: string;
  removeContainer?: boolean;
};

export const Portal = ({
  children,
  container,
  containerId = 'str-chat__portal-container',
  removeContainer,
}: PropsWithChildren<PortalProps>) => {
  const [_container, setContainer] = useState<PortalProps['container']>(container);

  useLayoutEffect(() => {
    if (!_container) {
      let containerElement: PortalProps['container'];

      containerElement = document.getElementById(containerId);

      if (!containerElement) {
        containerElement = document.createElement('div');
        containerElement.setAttribute('id', containerId);
        containerElement.setAttribute('class', 'str-chat');
        const root = document.getElementById('root');
        if (root) {
          root.appendChild(containerElement);
        } else {
          document.body.appendChild(containerElement);
        }
      }
      setContainer(containerElement);
    }

    return () => {
      if (removeContainer) _container?.parentNode?.removeChild(_container);
    };
  }, [_container, containerId]);

  if (!_container) return null;

  return createPortal(children, _container);
};
