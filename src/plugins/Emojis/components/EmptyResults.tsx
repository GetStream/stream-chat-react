import { useTranslationContext } from '../../../context';

/**
 * Shown in place of the emoji grid when a search yields no matches.
 */
export const EmptyResults = () => {
  const { t } = useTranslationContext('EmojiPicker');

  return (
    <div className='str-chat__emoji-picker__empty' role='status'>
      {t('No emoji found')}
    </div>
  );
};
