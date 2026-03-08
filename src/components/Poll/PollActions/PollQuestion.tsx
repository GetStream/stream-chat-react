import { useTranslationContext } from '../../../context';

export type PollQuestionProps = {
  question: string;
};

export const PollQuestion = ({ question }: PollQuestionProps) => {
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__modal__poll-question'>
      <div className='str-chat__modal__poll-question__label'>{t('Question')}</div>
      <div className='str-chat__modal__poll-question__text'>{question}</div>
    </div>
  );
};
