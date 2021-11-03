import { useViewContext } from '../contexts/ViewContext';

export const ExpandArrowLeft: React.FC = () => {
  const { setChatInfoOpen, setChatInfoItem, setNewChat } = useViewContext();

  return (
    <svg
      width='12'
      height='22'
      viewBox='0 0 12 22'
      fill='none'
      onClick={() => {
        setChatInfoOpen(true);
        setChatInfoItem(undefined);
        setNewChat(false);
      }}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M9.62818 21.0975C9.8865 21.358 10.2153 21.5 10.6027 21.5C11.3777 21.5 12 20.8844 12 20.1032C12 19.7125 11.8356 19.3574 11.5656 19.0851L3.34638 10.9882L11.5656 2.91488C11.8356 2.64262 12 2.27565 12 1.89684C12 1.11556 11.3777 0.5 10.6027 0.5C10.2153 0.5 9.8865 0.642052 9.62818 0.90248L0.493151 9.8991C0.164384 10.2069 0.0117417 10.5857 0 11C0 11.4143 0.164384 11.7694 0.493151 12.0891L9.62818 21.0975Z'
        fill='var(--text-low-emphasis)'
      />
    </svg>
  );
};
