import { ChatInfoItem, useViewContext } from '../contexts/ViewContext';

type Props = {
  chatInfoItem: ChatInfoItem;
};

export const ExpandArrow: React.FC<Props> = (props: Props) => {
  const { chatInfoItem } = props;

  const { setChatInfoOpen, setChatInfoItem, setNewChat } = useViewContext();

  return (
    <svg
      width='9'
      height='14'
      viewBox='0 0 9 14'
      fill='none'
      onClick={() => {
        setChatInfoOpen(false);
        setChatInfoItem(chatInfoItem);
        setNewChat(false);
      }}
      style={{ cursor: 'pointer' }}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M0.306157 13.6943C0.714368 14.1017 1.37622 14.1017 1.78443 13.6943L7.69749 7.7931C7.92319 7.5678 8.02409 7.2653 8.00019 6.9708C8.00629 6.696 7.90439 6.4193 7.69449 6.2096L1.7841 0.305678C1.37607 -0.101893 0.714528 -0.101893 0.306498 0.305678C-0.101522 0.713257 -0.101522 1.37408 0.306498 1.78166L5.53309 7.0025L0.306157 12.219C-0.102053 12.6264 -0.102053 13.2869 0.306157 13.6943Z'
        fill='var(--text-low-emphasis)'
      />
    </svg>
  );
};
