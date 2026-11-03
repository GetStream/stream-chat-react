import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import clsx from 'clsx';

/**
 * Spaces out the parts of a reply's UI that come in together, so they come in one after another
 * rather than at once. The counterpart of `AIUICascade` in StreamChatAI.
 */
export class AIUICascade {
  /** How long after the part before it a part comes in, in seconds. */
  static readonly step = 0.1;
  /** The longest a part waits for the parts before it, in seconds. */
  static readonly longestWait = 0.4;

  private next = 0;

  /** How long a part that comes in at `now`, in seconds, waits for the parts before it. */
  delay(
    now = (typeof performance === 'undefined' ? Date.now() : performance.now()) / 1000,
  ) {
    const start = Math.min(Math.max(now, this.next), now + AIUICascade.longestWait);
    this.next = start + AIUICascade.step;
    return start - now;
  }
}

type AIUIStage = {
  cascade: AIUICascade;
  /** Whether what shows now comes in with the part around it, rather than on its own. */
  isCarried: boolean;
};

const AIUIStageContext = createContext<AIUIStage | undefined>(undefined);

const nextFrame = (callback: () => void) => {
  if (typeof requestAnimationFrame === 'function') {
    const frame = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(frame);
  }
  const timer = setTimeout(callback, 0);
  return () => clearTimeout(timer);
};

// Shows its content, fading it in after the cascade's delay when it starts hidden.
const useEntrance = (startsHidden: boolean, cascade: AIUICascade | undefined) => {
  const [entrance, setEntrance] = useState({ delay: 0, hasShown: !startsHidden });
  useEffect(() => {
    if (entrance.hasShown) return;
    const delay = cascade?.delay() ?? 0;
    // A frame later, so the hidden state is painted and the change to shown transitions.
    return nextFrame(() => setEntrance({ delay, hasShown: true }));
  }, [cascade, entrance.hasShown]);
  return entrance;
};

const EntranceBox = ({
  children,
  className,
  delay,
  hasShown,
}: {
  children: ReactNode;
  delay: number;
  hasShown: boolean;
  className?: string;
}) => (
  <div
    className={clsx(
      'str-chat__ai-ui-entrance',
      !hasShown && 'str-chat__ai-ui-entrance--hidden',
      className,
    )}
    data-entrance={hasShown ? 'shown' : 'hidden'}
    style={hasShown && delay > 0 ? { transitionDelay: `${delay}s` } : undefined}
  >
    {children}
  </div>
);

/**
 * A reply's generated UI as a whole: it comes in when it first shows while the agent writes it,
 * and shows at once when it was written before, such as a reply from history.
 */
export const AIUIEntranceStage = ({
  children,
  className,
  isStreaming,
}: {
  children: ReactNode;
  /** Whether the agent is writing the UI as it first shows. */
  isStreaming: boolean;
  className?: string;
}) => {
  const [cascade] = useState(() => new AIUICascade());
  const { delay, hasShown } = useEntrance(isStreaming, cascade);
  const stage = useMemo(() => ({ cascade, isCarried: !hasShown }), [cascade, hasShown]);
  return (
    <AIUIStageContext.Provider value={stage}>
      <EntranceBox className={className} delay={delay} hasShown={hasShown}>
        {children}
      </EntranceBox>
    </AIUIStageContext.Provider>
  );
};

/**
 * Brings a part of a reply's generated UI in when it shows, such as when the agent writes it:
 * the part fades in, rising into place and coming into focus, after the parts that came in just
 * before it. What shows together with the reply's UI, or with a part around it, comes in with
 * that, so a reply written before it showed shows at once. With reduced motion it only fades.
 *
 * Renderers give it to each part they place. Every app component has it.
 */
export const AIUIEntrance = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const stage = useContext(AIUIStageContext);
  const { delay, hasShown } = useEntrance(!!stage && !stage.isCarried, stage?.cascade);
  const inner = useMemo(
    () => stage && { cascade: stage.cascade, isCarried: stage.isCarried || !hasShown },
    [hasShown, stage],
  );
  return (
    <AIUIStageContext.Provider value={inner}>
      <EntranceBox className={className} delay={delay} hasShown={hasShown}>
        {children}
      </EntranceBox>
    </AIUIStageContext.Provider>
  );
};
