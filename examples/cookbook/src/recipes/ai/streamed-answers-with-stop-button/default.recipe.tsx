import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { isMessageAIGenerated } from './isMessageAIGenerated';
import { SimulateAnswer } from './SimulateAnswer';
import { WithStreamedAnswers } from './WithStreamedAnswers';

// "Streamed answers with a stop button": the assistant's replies type out as they stream, its state
// shows at the end of the message list, and a Stop button replaces the send button while it
// answers. SimulateAnswer only serves the screenshots.
const Wrapper = ({ children }: PropsWithChildren) => (
  <WithStreamedAnswers>
    <SimulateAnswer />
    {children}
  </WithStreamedAnswers>
);

const recipe: RecipeConfig = {
  chatProps: () => ({ isMessageAIGenerated }),
  Wrapper,
};

export default recipe;
