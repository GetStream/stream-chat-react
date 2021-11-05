type Props = {
  cooldownRemaining?: number;
};

export const CommandBolt: React.FC<Props> = (props) => {
  const { cooldownRemaining } = props;
  const fill = cooldownRemaining ? 'var(--disabled)' : 'var(--accent-primary)';
  return (
    <svg width='10' height='20' viewBox='0 0 10 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path
        d='M4.54545 0H10L6.36364 7.27273H10L3.18182 20L4.54545 10.9091H0L4.54545 0Z'
        fill={fill}
      />
    </svg>
  );
};
