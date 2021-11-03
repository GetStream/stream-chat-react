import { useViewContext } from '../../contexts/ViewContext';

export const ChatInfoItem = () => {
  const { chatInfoItem } = useViewContext();
  return <div>chat specifics is: {chatInfoItem}</div>;
};
