import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';
import type { RecipeConfig } from '../../../base/recipe';
import { DemoProductShots } from './DemoProductShots';
import { installProductAttachments } from './installProductAttachments';
import { WithProductAttachments } from './WithProductAttachments';

const ProductAttachmentsSetup = () => {
  const { client } = useChatContext();
  useEffect(() => installProductAttachments(client), [client]);
  return null;
};

const Wrapper = ({ children }: PropsWithChildren) => (
  <WithProductAttachments>
    <ProductAttachmentsSetup />
    <DemoProductShots />
    {children}
  </WithProductAttachments>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
