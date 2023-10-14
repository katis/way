import { type QueryCodec, urlSearchParamsCodec } from "./codec.js";
import { kebabCase } from "./kebabCase.js";
import { $param } from "./param.js";

/** Mark a schema section as a path building segment. */
export type path = typeof path;
/** Mark a schema section as a path building segment. */
export const path: unique symbol = Symbol("way/path");

/** Pass to path to build a route string.  */
export type route = typeof route;
/** Pass to path to build a route string.  */
export const route: unique symbol = Symbol("way/route");

/** Pass to path to create a new builder relative to the path.  */
export const rel: unique symbol = Symbol("way/relative");
/** Pass to path to create a new builder relative to the path.  */
export type rel = typeof rel;

/** Pass to path to parse a search string.  */
export const query: unique symbol = Symbol("way/query");
/** Pass to path to parse a search string.  */
export type query = typeof query;

/** Create a root config  */
export const root = <S extends Schema>(
  schema: S,
  config?: Partial<RootConfig>
): PathBuilder<S> =>
  proxyPathBuilder<S>(
    schema,
    {
      relative: false,
      codec: urlSearchParamsCodec,
      formatSegment: kebabCase,
      ...config,
    },
    []
  );

export type RootConfig = {
  /** Build a relative path, without a leading "/". */
  relative: boolean;
  /** Codec for converting query string to object and back. */
  codec: QueryCodec;
  /** Formats a schema segment to path string segment, by default converts to kebab-case. */
  formatSegment: (segment: string) => string;
};

/** Basic shape for a way path schema. */
export type Schema = {
  [path]?: QueryParser<any>;
  [$param]?: Schema;
  [segment: string]: Schema;
};

/** Convert a Schema type into a PathBuilder. */
export type PathBuilder<S> = S extends HasPath<infer Q>
  ? PathSegment<Q> & PathBuilder<NoPath<S>>
  : S extends HasParam<infer SB>
  ? { [key: string]: PathBuilder<SB> } & PathBuilder<NoParam<S>> & Segment
  : { [P in keyof S]: PathBuilder<S[P]> } & Segment;

type HasPath<Q> = { [path]: QueryParser<Q> };
type NoPath<S> = Omit<S, typeof path>;
type HasParam<S extends Schema> = { [$param]: S };
type NoParam<S> = Omit<S, typeof $param>;

/** A segment of a typed path. */
export interface Segment {
  /** Create a path to this segment without query parameters by passing `chk.route` to it */
  (routeSymbol: route): string;
  (relativeSymbol: rel): this;
}

/** A segment of a typed path that can build a path string with optional query parameter. */
export type PathSegment<Q> = Segment &
  BuildPath<Q> & {
    (querySymbol: query, search: string): Q;
  };

/** Build a path string, with a provided query parameter. */
export type BuildPath<Q> = Q extends NoQuery
  ? (query?: NoQuery) => string
  : (query: Q) => string;

export type QueryParserResult<Q> = {
  codec: QueryCodec;
  parser: QueryParser<Q>;
};

/** Parser for decoded query parameters. */
export type QueryParser<Q> = {
  parse: (query: AnyQuery) => Q;
};

/** A type for a missing query. */
export type NoQuery = undefined;
/** A no-op query parser that just returns undefined.  */
export const NoQuery: QueryParser<undefined> = {
  parse: () => undefined,
};

/** Type of a decodec query query string.  */
export type AnyQuery = { [key: string]: unknown };
/** Identity parser for a decoded query object.  */
export const AnyQuery: QueryParser<AnyQuery> = {
  parse: (query) => query,
};

type ProxyTarget = ((query?: unknown) => string) & {
  schema: Schema;
  parts: readonly string[];
  config: RootConfig;
};

const proxyPathBuilder = <S extends Schema>(
  schema: S,
  config: RootConfig,
  parts: readonly string[]
): PathBuilder<S> =>
  new Proxy(proxyTarget(schema, config, parts), target) as any;

const proxyTarget = (
  schema: Schema,
  config: RootConfig,
  parts: readonly string[]
): ProxyTarget => {
  function wayPath(_query?: unknown): string {
    throw new Error("This should never be called, please file an issue");
  }
  return Object.assign(wayPath, { schema, config, parts });
};

const target: ProxyHandler<ProxyTarget> = {
  get(
    { schema, config, parts },
    prop: string | symbol
  ): PathBuilder<any> | (() => string) | undefined {
    if (typeof prop === "string")
      return proxyPathBuilder(schema, config, [...parts, prop]);
    if (prop === Symbol.toPrimitive) return () => buildPath(config, parts);
  },
  apply(
    { schema, config, parts },
    _self,
    [arg, search]: ApplyArgs
  ): string | PathBuilder<any> | AnyQuery | undefined {
    if (typeof arg === "symbol") {
      switch (arg) {
        case route:
          return buildPath(config, parts);
        case rel: {
          return proxyPathBuilder(
            getSchema(schema, parts),
            { ...config, relative: true },
            []
          );
        }
        case query: {
          if (search === undefined)
            throw Error("No search string provided with way.query");
          const parser = getSchema(schema, parts)?.[path] || NoQuery;
          return parser.parse(
            typeof search === "string" ? config.codec.decode(search) : search
          );
        }
        default:
          throw Error(`Invalid symbol ${arg} provided to path builder`);
      }
    }
    return buildPath(config, parts, arg);
  },
};

type ApplyArgs = [
  query | rel | route | AnyQuery | undefined,
  string | AnyQuery | undefined,
  ...unknown[]
];

const buildPath = (
  config: RootConfig,
  parts: readonly string[],
  query?: AnyQuery
): string => {
  const prefix = config.relative ? "" : "/";
  const path = prefix + parts.map((s) => config.formatSegment(s)).join("/");
  if (query != null) {
    const search = config.codec.encode(query);
    if (search) return `${path}?${search}`;
  }
  return path;
};

const getSchema = (schema: Schema, parts: readonly string[]): Schema => {
  let current: Schema | undefined = schema;
  for (const part of parts) {
    current = current[part] ?? current[$param];
    if (!current)
      throw Error(`Path ${parts.join("/")} has no configured schema`);
  }
  return current;
};
