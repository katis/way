/**
 * Object for converting a query string to object and back.
 * Must be reversible.
 */
export type QueryCodec = {
  /** Convert a query parameter object into a URL string */
  encode(query: Record<string, unknown>): string;
  /** Parse a URL query string into an object. */
  decode(encoded: string): Record<string, unknown>;
};

/** Default query codec that uses URLSearchParams for encoding and decoding. */
export const urlSearchParamsCodec: QueryCodec = {
  encode: (query) =>
    query == null ? "" : new URLSearchParams(query as any).toString(),
  decode: (encoded) => Object.fromEntries(new URLSearchParams(encoded)),
};
