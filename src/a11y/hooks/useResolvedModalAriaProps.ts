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
 * Resolves modal labeling/description attributes from explicit props first,
 * then from the modal dialog id convention (`${dialogId}-title|description`).
 *
 * Rules:
 * - `aria-labelledby` wins over `aria-label`.
 * - `aria-describedby` defaults to inferred id when explicit value is absent.
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
