import type { ComponentType, PropsWithChildren } from 'react';
import { WithComponents } from 'stream-chat-react';
import type { RecipeConfig } from '../../../base/recipe';
import { SimulateMessageStates } from './SimulateMessageStates';

/**
 * For the step variants: registers one step's `CustomMessageUi` on the `MessageUI` key, as
 * `WithCustomMessageUi` does, and shows the demo messages' simulated states.
 */
export const stepRecipe = (MessageUI: ComponentType): RecipeConfig => {
  const overrides = { MessageUI };
  const Wrapper = ({ children }: PropsWithChildren) => (
    <WithComponents overrides={overrides}>{children}</WithComponents>
  );
  return { chatViewChildren: <SimulateMessageStates />, Wrapper };
};
