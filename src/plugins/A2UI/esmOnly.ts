// What `require('stream-chat-react/a2ui')` reaches. The A2UI packages the renderer runs are ES
// modules only, so it is too: this says so, rather than failing deep in a dependency.
throw new Error(
  'stream-chat-react/a2ui is an ES module only, as the A2UI packages it runs (@a2ui/web_core and @a2ui/react) are: import it rather than require it.',
);

export {};
