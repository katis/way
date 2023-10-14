/** Mark the schema section as a parameter segment. */
export const $param: unique symbol = Symbol("way/param");

/** Marks a schema section as a path building segment. */
export type param = typeof $param;

type PathSegments = { [pathName: string]: param };

/** Define a schema section as a dynamic parameter segment. */
export const param: PathSegments = new Proxy({} as PathSegments, {
  get: (_, p) => (typeof p === "string" ? $param : undefined),
});
