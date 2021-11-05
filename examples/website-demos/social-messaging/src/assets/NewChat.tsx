import { useViewContext } from '../contexts/ViewContext';

export const NewChat: React.FC = () => {
  const { setNewChat } = useViewContext();

  return (
    <svg
      width='40'
      height='40'
      viewBox='0 0 40 40'
      fill='none'
      onClick={() => setNewChat((prev) => !prev)}
      style={{ borderRadius: '20px', cursor: 'pointer', marginRight: '8px' }}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M0 20C0 8.95431 8.95431 0 20 0C31.0457 0 40 8.95431 40 20C40 31.0457 31.0457 40 20 40C8.95431 40 0 31.0457 0 20Z'
        fill='var(--accent-primary)'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M29 29.0001H11V24.7571L24.435 11.3221C24.8255 10.9317 25.4585 10.9317 25.849 11.3221L28.678 14.1511C29.0684 14.5416 29.0684 15.1746 28.678 15.5651L17.243 27.0001H29V29.0001ZM13 27.0001H14.414L23.728 17.6861L22.314 16.2721L13 25.5861V27.0001ZM26.556 14.8581L25.142 16.2721L23.728 14.8581L25.142 13.4441L26.556 14.8581Z'
        fill='var(--white)'
      />
      <path
        d='M20 39C9.50659 39 1 30.4934 1 20H-1C-1 31.598 8.40202 41 20 41V39ZM39 20C39 30.4934 30.4934 39 20 39V41C31.598 41 41 31.598 41 20H39ZM20 1C30.4934 1 39 9.50659 39 20H41C41 8.40202 31.598 -1 20 -1V1ZM20 -1C8.40202 -1 -1 8.40202 -1 20H1C1 9.50659 9.50659 1 20 1V-1Z'
        fill='var(--accent-primary)'
      />
    </svg>
  );
};
