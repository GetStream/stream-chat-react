import { useMemo } from 'react';
import { useAriaIdentifiers } from './useAriaIdentifiers';

export type ResolvedModalAriaProps = {
  'aria-describedby'?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

type UseResolvedModalAriaPropsParams = {
  ariaDescribedby?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  dialogId?: string;
};

/**
 * Resolves a modal's `aria-label`, `aria-labelledby` and `aria-describedby`. Explicit values win;
 * otherwise `<dialogId>-title` and `<dialogId>-description` fill in `aria-labelledby` and
 * `aria-describedby`. An explicit `ariaLabel` suppresses the inferred title ID, and
 * `aria-labelledby` wins over `aria-label`.
 */
export const useResolvedModalAriaProps = ({
  ariaDescribedby,
  ariaLabel,
  ariaLabelledby,
  dialogId,
}: UseResolvedModalAriaPropsParams): ResolvedModalAriaProps => {
  const { descriptionId, titleId } = useAriaIdentifiers(dialogId);

  return useMemo(() => {
    const resolvedAriaLabelledby = ariaLabel
      ? ariaLabelledby
      : (ariaLabelledby ?? titleId);
    const resolvedAriaDescribedby = ariaDescribedby ?? descriptionId;
    const resolvedAriaLabel = resolvedAriaLabelledby ? undefined : ariaLabel;

    return {
      'aria-describedby': resolvedAriaDescribedby,
      'aria-label': resolvedAriaLabel,
      'aria-labelledby': resolvedAriaLabelledby,
    };
  }, [ariaDescribedby, ariaLabel, ariaLabelledby, descriptionId, titleId]);
};
