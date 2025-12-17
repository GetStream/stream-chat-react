import './LoadingScreen.scss';

interface LoadingScreenProps {
  isFadingOut?: boolean;
}

export const LoadingScreen = ({ isFadingOut = false }: LoadingScreenProps) => {
  return (
    <div
      className={`ai-demo-loading ${isFadingOut ? 'ai-demo-loading--fading-out' : ''}`}
    >
      <div className="ai-demo-loading__content">
        <div className="ai-demo-loading__icon-container">
          <span className="material-symbols-rounded ai-demo-loading__icon">
            auto_awesome
          </span>
          <div className="ai-demo-loading__pulse" />
        </div>
        <h1 className="ai-demo-loading__title">Stream AI Chat</h1>
        <p className="ai-demo-loading__subtitle">
          Initializing Stream AI assistant...
        </p>
        <div className="ai-demo-loading__dots">
          <span className="ai-demo-loading__dot"></span>
          <span className="ai-demo-loading__dot"></span>
          <span className="ai-demo-loading__dot"></span>
        </div>
      </div>
    </div>
  );
};
