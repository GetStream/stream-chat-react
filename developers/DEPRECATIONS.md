## Deprecations

You can deprecate a feature or a component once:
1. an alternative exists.
2. the support for the given functionality is scheduled for termination

The deprecated component should be marked as follows:

```typescript jsx
/**
 * @deprecated - This UI component will be removed in the next major release. This component is deprecated because <XY>.
 * For more information see [docs link](https://....)
 *
 * FixedHeightMessage - This component renders a single message.
 * It uses fixed height elements to make sure it works well in VirtualizedMessageList
 */
```

### How to deprecate?

1. Deprecated component:
   1. does not receive an alternative -> update the documentation on how to implement the deprecated feature.
   2. receives an alternative -> update the documentation on how to use the introduced alternative solution.
2. Commit the changes under `deprecate` commit type, with commit description stating the reasons for deprecation.
3. Create an issue, so it can be scheduled for removal in foreseeable future. Tag the issue with the label `breaking`.
