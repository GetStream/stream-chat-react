import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useComponentContext } from '../../context/ComponentContext';
import { DownloadButton } from '../Attachment';
import { ImagePlaceholder as DefaultImagePlaceholder } from './ImagePlaceholder';
import { sanitizeUrl } from '@braintree/sanitize-url';

export type BaseImageProps = React.ComponentPropsWithRef<'img'> & {
  showDownloadButtonOnError?: boolean;
};

export const BaseImage = forwardRef<HTMLImageElement, BaseImageProps>(function BaseImage(
  { src, ...props },
  ref,
) {
  const {
    alt: propsAlt,
    className: propsClassName,
    onError: propsOnError,
    showDownloadButtonOnError = false,
    ...imgProps
  } = props;
  const [error, setError] = useState(false);
  const { ImagePlaceholder: ImagePlaceholderComponent = DefaultImagePlaceholder } =
    useComponentContext();

  const sanitizedUrl = useMemo(() => sanitizeUrl(src), [src]);
  useEffect(
    () => () => {
      setError(false);
    },
    [sanitizedUrl],
  );

  if (error) {
    return (
      <>
        <ImagePlaceholderComponent
          className={clsx(propsClassName, 'str-chat__base-image--load-failed')}
        />
        {showDownloadButtonOnError && <DownloadButton assetUrl={sanitizedUrl} />}
      </>
    );
  }

  return (
    <img
      data-testid='str-chat__base-image'
      {...imgProps}
      alt={propsAlt}
      className={clsx(propsClassName, 'str-chat__base-image')}
      onError={(e) => {
        setError(true);
        propsOnError?.(e);
      }}
      ref={ref}
      src={sanitizedUrl}
    />
  );
});
