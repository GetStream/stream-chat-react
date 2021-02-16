import { useEffect, useRef } from 'react';

export default () => {
  const isMounted = useRef(true);

  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );

  return isMounted;
};
