import mergeWith from 'lodash.mergewith';
import { UR } from 'stream-chat';

const overrideEverything = (_: unknown, source: unknown) => source;

export const mergeDeep = <TObject, TSource>(target: TObject, source: TSource) =>
  mergeWith<TObject, TSource>(target, source, overrideEverything);

const overrideUndefinedOnly = (object: unknown, source: unknown) => object ?? source;

export const mergeDeepUndefined = <TObject extends UR, TSource extends UR>(
  target: TObject,
  source: TSource,
) => mergeWith<TObject, TSource>(target, source, overrideUndefinedOnly);
