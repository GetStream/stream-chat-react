import { useTranslationContext } from '../../../context';

export type EmptyResultsProps = {
  /** Native glyph shown above the "no results" text (from the `noResultsEmoji` option). */
  emoji?: string;
};

/**
 * Shown in place of the emoji grid when a search yields no matches.
 */
export const EmptyResults = ({ emoji }: EmptyResultsProps) => {
  const { t } = useTranslationContext();

  return (
    <div className='str-chat__emoji-picker__empty' role='status'>
      {emoji ? (
        <span aria-hidden='true' className='str-chat__emoji-picker__empty-emoji'>
          {emoji}
        </span>
      ) : null}
      {t('No emoji found')}
    </div>
  );
};
