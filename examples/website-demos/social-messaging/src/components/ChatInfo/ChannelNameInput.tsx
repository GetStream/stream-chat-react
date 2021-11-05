type Props = {
  channelName?: string;
  setChannelName: (value: React.SetStateAction<string | undefined>) => void;
};

export const ChannelNameInput: React.FC<Props> = (props) => {
  const { channelName = '', setChannelName } = props;

  const handleChange = (event: { preventDefault: () => void; target: { value: string } }) => {
    event.preventDefault();
    setChannelName(event.target.value);
  };

  return (
    <input
      className='chat-info-name-edit'
      onChange={handleChange}
      type='text'
      value={channelName}
    />
  );
};
