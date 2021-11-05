type Props = {
  closeModal: React.Dispatch<React.SetStateAction<boolean>>;
};

export const CloseXCircle: React.FC<Props> = (props) => {
  const { closeModal } = props;

  return (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      onClick={() => closeModal((prev) => !prev)}
      style={{ cursor: 'pointer' }}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12Z'
        fill='var(--borders)'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M6.3352 6.3352C5.88827 6.78214 5.88827 7.50678 6.3352 7.95372L10.3815 12L6.33522 16.0463C5.88828 16.4932 5.88828 17.2179 6.33522 17.6648C6.78216 18.1117 7.50679 18.1117 7.95373 17.6648L12 13.6185L16.0463 17.6648C16.4932 18.1117 17.2178 18.1117 17.6648 17.6648C18.1117 17.2179 18.1117 16.4932 17.6648 16.0463L13.6185 12L17.6648 7.95372C18.1117 7.50678 18.1117 6.78215 17.6648 6.33521C17.2179 5.88827 16.4932 5.88827 16.0463 6.33521L12 10.3815L7.95372 6.3352C7.50678 5.88827 6.78214 5.88827 6.3352 6.3352Z'
        fill='#72767E'
      />
    </svg>
  );
};
